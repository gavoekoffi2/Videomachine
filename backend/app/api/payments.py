from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.payment import Payment
from app.models.user import User
from app.models.subscription import Subscription
from app.services.payment_service import payment_service, PLAN_PRICES

router = APIRouter(prefix="/api/payments", tags=["payments"])
logger = logging.getLogger(__name__)

PLAN_LIMITS = {
    "free": 3,
    "starter": 20,
    "pro": 100,
    "enterprise": -1,  # unlimited
}


class PaymentInit(BaseModel):
    plan: str
    currency: str = "XOF"
    callback_url: Optional[str] = None
    return_url: Optional[str] = None


class PaymentVerify(BaseModel):
    transaction_id: str


@router.get("/plans")
async def get_plans():
    return {
        "plans": [
            {
                "id": "free",
                "name": "Gratuit",
                "price_xof": 0,
                "price_eur": 0,
                "videos_per_month": 3,
                "features": ["3 vidéos/mois", "Qualité HD", "Support email"],
            },
            {
                "id": "starter",
                "name": "Starter",
                "price_xof": 5000,
                "price_eur": 8,
                "videos_per_month": 20,
                "features": ["20 vidéos/mois", "Qualité Full HD", "Voix IA premium", "Support prioritaire"],
                "popular": False,
            },
            {
                "id": "pro",
                "name": "Pro",
                "price_xof": 12000,
                "price_eur": 18,
                "videos_per_month": 100,
                "features": ["100 vidéos/mois", "4K disponible", "Toutes les voix IA", "API accès", "Support 24/7"],
                "popular": True,
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "price_xof": 30000,
                "price_eur": 45,
                "videos_per_month": -1,
                "features": ["Vidéos illimitées", "4K + personnalisation", "API complète", "Manager dédié", "SLA garanti"],
            },
        ]
    }


@router.post("/initiate")
async def initiate_payment(
    data: PaymentInit,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if data.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")

    amount = payment_service.get_plan_price(data.plan, data.currency)
    if amount == 0:
        raise HTTPException(status_code=400, detail="Cannot pay for free plan")

    # Create pending payment record
    description = f"VideoMachine {data.plan.title()} - Abonnement mensuel"
    result = await payment_service.create_transaction(
        user_email=current_user.email,
        user_name=current_user.full_name or current_user.username,
        amount=amount,
        currency=data.currency,
        description=description,
        callback_url=data.callback_url,
        return_url=data.return_url,
    )

    payment = Payment(
        user_id=current_user.id,
        transaction_id=result["transaction_id"],
        fedapay_id=result.get("transaction_id"),
        amount=amount,
        currency=data.currency,
        status="pending",
        plan=data.plan,
        description=description,
    )
    db.add(payment)
    db.commit()

    return {
        "transaction_id": result["transaction_id"],
        "payment_url": result["payment_url"],
        "amount": amount,
        "currency": data.currency,
        "plan": data.plan,
        "mock": result.get("mock", False),
    }


@router.post("/verify")
async def verify_payment(
    data: PaymentVerify,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(
        Payment.transaction_id == data.transaction_id,
        Payment.user_id == current_user.id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    result = await payment_service.verify_transaction(data.transaction_id)
    status = result.get("status", "pending")

    if status in ("approved", "transferred"):
        payment.status = "completed"
        payment.completed_at = datetime.utcnow()

        # Upgrade user plan
        plan = payment.plan
        current_user.plan = plan
        current_user.videos_limit = PLAN_LIMITS.get(plan, 3)

        # Update subscription
        sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
        if sub:
            sub.plan = plan
            sub.status = "active"
            sub.videos_limit = PLAN_LIMITS.get(plan, 3)
            sub.current_period_start = datetime.utcnow()
            sub.current_period_end = datetime.utcnow() + timedelta(days=30)
        else:
            sub = Subscription(
                user_id=current_user.id,
                plan=plan,
                status="active",
                price=payment.amount,
                currency=payment.currency,
                videos_limit=PLAN_LIMITS.get(plan, 3),
                current_period_end=datetime.utcnow() + timedelta(days=30),
            )
            db.add(sub)
    elif status == "declined":
        payment.status = "failed"

    db.commit()
    return {"status": payment.status, "plan": payment.plan}


@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle FedaPay webhook notifications"""
    try:
        body = await request.json()
        logger.info(f"FedaPay webhook: {body}")

        transaction_id = str(body.get("id") or body.get("transaction_id", ""))
        event_status = body.get("status", "")

        if transaction_id and event_status in ("approved", "transferred"):
            payment = db.query(Payment).filter(Payment.fedapay_id == transaction_id).first()
            if payment and payment.status == "pending":
                payment.status = "completed"
                payment.completed_at = datetime.utcnow()

                user = db.query(User).filter(User.id == payment.user_id).first()
                if user:
                    user.plan = payment.plan
                    user.videos_limit = PLAN_LIMITS.get(payment.plan, 3)

                db.commit()

        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": False}


@router.get("/history")
async def payment_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    payments = (db.query(Payment)
                .filter(Payment.user_id == current_user.id)
                .order_by(Payment.created_at.desc())
                .limit(50)
                .all())
    return [
        {
            "id": p.id,
            "transaction_id": p.transaction_id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "plan": p.plan,
            "created_at": p.created_at,
            "completed_at": p.completed_at,
        }
        for p in payments
    ]


@router.post("/demo-complete/{transaction_id}")
async def demo_complete_payment(
    transaction_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Demo endpoint to simulate payment completion (dev only)"""
    payment = db.query(Payment).filter(
        Payment.transaction_id == transaction_id,
        Payment.user_id == current_user.id
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = "completed"
    payment.completed_at = datetime.utcnow()

    current_user.plan = payment.plan
    current_user.videos_limit = PLAN_LIMITS.get(payment.plan, 3)

    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if sub:
        sub.plan = payment.plan
        sub.status = "active"
        sub.videos_limit = PLAN_LIMITS.get(payment.plan, 3)
        sub.current_period_end = datetime.utcnow() + timedelta(days=30)
    db.commit()
    return {"message": "Payment completed (demo)", "plan": payment.plan}
