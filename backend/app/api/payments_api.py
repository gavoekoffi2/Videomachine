"""FedaPay payment integration for African market."""
import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_active_user
from app.core.config import settings
from app.models.payment import Payment
from app.models.user import User

router = APIRouter(prefix="/api/payments", tags=["payments"])
logger = logging.getLogger(__name__)

PLAN_LIMITS = {"free": 3, "starter": 20, "pro": 100, "enterprise": -1}
PLAN_PRICES = {
    "starter": {"XOF": 5000, "EUR": 8},
    "pro": {"XOF": 12000, "EUR": 18},
    "enterprise": {"XOF": 30000, "EUR": 45},
}
FEDAPAY_URLS = {
    "sandbox": "https://sandbox-api.fedapay.com",
    "live": "https://api.fedapay.com",
}


@router.get("/plans")
async def get_plans():
    return {"plans": [
        {"id": "free", "name": "Gratuit", "price_xof": 0, "price_eur": 0, "videos": 3,
         "features": ["3 vidéos/mois", "YouTube Shorts", "Twitter Bot", "Support email"]},
        {"id": "starter", "name": "Starter", "price_xof": 5000, "price_eur": 8, "videos": 20,
         "features": ["20 vidéos/mois", "Toutes les fonctionnalités", "AFM inclus", "Support prioritaire"],
         "popular": False},
        {"id": "pro", "name": "Pro", "price_xof": 12000, "price_eur": 18, "videos": 100,
         "features": ["100 vidéos/mois", "Toutes fonctionnalités", "API accès", "Support 24/7"],
         "popular": True},
        {"id": "enterprise", "name": "Enterprise", "price_xof": 30000, "price_eur": 45, "videos": -1,
         "features": ["Illimité", "Tout inclus", "Manager dédié", "SLA garanti"]},
    ]}


class PayInput(BaseModel):
    plan: str
    currency: str = "XOF"
    callback_url: Optional[str] = None
    return_url: Optional[str] = None


@router.post("/initiate")
async def initiate(data: PayInput, current_user: User = Depends(get_active_user), db: Session = Depends(get_db)):
    if data.plan not in PLAN_PRICES:
        raise HTTPException(400, "Plan invalide")

    amount = PLAN_PRICES[data.plan].get(data.currency.upper(), PLAN_PRICES[data.plan]["XOF"])
    desc = f"VideoMachine {data.plan.title()} - Abonnement mensuel"

    if settings.FEDAPAY_SECRET_KEY:
        base_url = FEDAPAY_URLS.get(settings.FEDAPAY_ENV, FEDAPAY_URLS["sandbox"])
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    f"{base_url}/v1/transactions",
                    headers={"Authorization": f"Bearer {settings.FEDAPAY_SECRET_KEY}"},
                    json={
                        "description": desc, "amount": amount,
                        "currency": {"iso": data.currency},
                        "callback_url": data.callback_url or "https://yourdomain.com/api/payments/webhook",
                        "return_url": data.return_url or "https://yourdomain.com/dashboard",
                        "customer": {"email": current_user.email,
                                     "firstname": (current_user.full_name or current_user.username).split()[0]},
                    },
                    timeout=30
                )
                resp.raise_for_status()
                tx = resp.json().get("v1/transaction", resp.json())
                tx_id = str(tx.get("id"))
                # Get token
                tok_resp = await client.get(f"{base_url}/v1/transactions/{tx_id}/token",
                                             headers={"Authorization": f"Bearer {settings.FEDAPAY_SECRET_KEY}"})
                token = tok_resp.json().get("token", "")
                checkout_base = "https://sandbox-checkout.fedapay.com" if settings.FEDAPAY_ENV == "sandbox" else "https://checkout.fedapay.com"
                payment_url = f"{checkout_base}/{token}"
            except Exception as e:
                logger.error(f"FedaPay error: {e}")
                tx_id = f"mock_{datetime.utcnow().timestamp():.0f}"
                payment_url = "/demo-payment"
    else:
        import uuid
        tx_id = f"mock_{uuid.uuid4().hex[:12]}"
        payment_url = "/demo-payment"

    pay = Payment(user_id=current_user.id, transaction_id=tx_id, fedapay_id=tx_id,
                  amount=amount, currency=data.currency, status="pending", plan=data.plan, description=desc)
    db.add(pay)
    db.commit()
    return {"transaction_id": tx_id, "payment_url": payment_url, "amount": amount,
            "currency": data.currency, "plan": data.plan, "mock": not settings.FEDAPAY_SECRET_KEY}


@router.post("/demo-complete/{transaction_id}")
async def demo_complete(transaction_id: str, current_user: User = Depends(get_active_user), db: Session = Depends(get_db)):
    pay = db.query(Payment).filter(Payment.transaction_id == transaction_id, Payment.user_id == current_user.id).first()
    if not pay:
        raise HTTPException(404, "Paiement introuvable")
    pay.status = "completed"
    pay.completed_at = datetime.utcnow()
    current_user.plan = pay.plan
    current_user.videos_limit = PLAN_LIMITS.get(pay.plan, 3)
    db.commit()
    return {"message": f"Plan {pay.plan} activé!", "plan": pay.plan}


@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
        tx_id = str(body.get("id") or "")
        ev_status = body.get("status", "")
        if tx_id and ev_status in ("approved", "transferred"):
            pay = db.query(Payment).filter(Payment.fedapay_id == tx_id).first()
            if pay and pay.status == "pending":
                pay.status = "completed"
                pay.completed_at = datetime.utcnow()
                user = db.query(User).filter(User.id == pay.user_id).first()
                if user:
                    user.plan = pay.plan
                    user.videos_limit = PLAN_LIMITS.get(pay.plan, 3)
                db.commit()
    except Exception as e:
        logger.error(f"Webhook error: {e}")
    return {"received": True}


@router.get("/history")
async def history(current_user: User = Depends(get_active_user), db: Session = Depends(get_db)):
    pays = db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).limit(50).all()
    return [{"id": p.id, "transaction_id": p.transaction_id, "amount": p.amount,
             "currency": p.currency, "status": p.status, "plan": p.plan,
             "created_at": p.created_at, "completed_at": p.completed_at} for p in pays]
