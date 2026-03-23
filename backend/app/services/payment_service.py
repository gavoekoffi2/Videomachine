"""
FedaPay Payment Service
Handles payments for African market (Mobile Money, etc.)
"""
import httpx
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

PLAN_PRICES = {
    "starter": {"xof": 5000, "eur": 8, "videos": 20},
    "pro": {"xof": 12000, "eur": 18, "videos": 100},
    "enterprise": {"xof": 30000, "eur": 45, "videos": -1},  # -1 = unlimited
}

FEDAPAY_BASE_URLS = {
    "sandbox": "https://sandbox-api.fedapay.com",
    "live": "https://api.fedapay.com",
}


class FedaPayService:
    def __init__(self):
        self.api_key = settings.FEDAPAY_SECRET_KEY
        self.env = settings.FEDAPAY_ENV
        self.base_url = FEDAPAY_BASE_URLS.get(self.env, FEDAPAY_BASE_URLS["sandbox"])

    @property
    def headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def create_transaction(self, user_email: str, user_name: str,
                                  amount: int, currency: str = "XOF",
                                  description: str = "VideoMachine Subscription",
                                  callback_url: str = None,
                                  return_url: str = None) -> dict:
        """Create a FedaPay transaction"""
        if not self.api_key:
            return self._mock_transaction(amount, currency)

        payload = {
            "description": description,
            "amount": amount,
            "currency": {"iso": currency},
            "callback_url": callback_url or "https://yourdomain.com/api/payments/webhook",
            "return_url": return_url or "https://yourdomain.com/dashboard?payment=success",
            "customer": {
                "email": user_email,
                "firstname": user_name.split()[0] if user_name else "",
                "lastname": user_name.split()[-1] if len(user_name.split()) > 1 else "",
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/v1/transactions",
                    json=payload,
                    headers=self.headers,
                    timeout=30
                )
                resp.raise_for_status()
                data = resp.json()
                transaction = data.get("v1/transaction", data)
                return {
                    "transaction_id": str(transaction.get("id")),
                    "payment_url": await self._get_payment_url(transaction.get("id")),
                    "status": transaction.get("status"),
                    "amount": amount,
                    "currency": currency,
                }
            except Exception as e:
                logger.error(f"FedaPay create transaction failed: {e}")
                return self._mock_transaction(amount, currency)

    async def _get_payment_url(self, transaction_id: int) -> str:
        """Get the payment URL (token) for a transaction"""
        if not self.api_key or not transaction_id:
            return "#"
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/v1/transactions/{transaction_id}/token",
                    headers=self.headers
                )
                resp.raise_for_status()
                data = resp.json()
                token = data.get("token")
                base = "https://sandbox-checkout.fedapay.com" if self.env == "sandbox" else "https://checkout.fedapay.com"
                return f"{base}/{token}"
            except Exception as e:
                logger.error(f"Failed to get payment URL: {e}")
                return "#"

    async def verify_transaction(self, transaction_id: str) -> dict:
        """Verify transaction status"""
        if not self.api_key:
            return {"status": "approved", "amount": 0}

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/v1/transactions/{transaction_id}",
                    headers=self.headers
                )
                resp.raise_for_status()
                data = resp.json()
                transaction = data.get("v1/transaction", data)
                return {
                    "status": transaction.get("status"),
                    "amount": transaction.get("amount"),
                    "currency": transaction.get("currency", {}).get("iso", "XOF"),
                }
            except Exception as e:
                logger.error(f"FedaPay verify failed: {e}")
                return {"status": "error", "error": str(e)}

    def _mock_transaction(self, amount: int, currency: str) -> dict:
        """Mock transaction for testing without API key"""
        import uuid
        return {
            "transaction_id": f"mock_{uuid.uuid4().hex[:12]}",
            "payment_url": "/demo-payment",
            "status": "pending",
            "amount": amount,
            "currency": currency,
            "mock": True,
        }

    def get_plan_price(self, plan: str, currency: str = "XOF") -> int:
        """Get price for a plan"""
        plan_data = PLAN_PRICES.get(plan, {})
        return plan_data.get(currency.lower(), plan_data.get("xof", 0))


payment_service = FedaPayService()
