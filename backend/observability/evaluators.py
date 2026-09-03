import logging
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)


class ConfirmationGuardrailEvaluator:
    """
    Evaluator for Agent 1 (Order Confirmation).
    Asserts that confirmation is granted ONLY when all three mandatory COD criteria
    (address, amount, and intent to receive) are explicitly satisfied.
    """

    def evaluate(self, run_output: Dict[str, Any], expected: Dict[str, Any]) -> Tuple[bool, float, str]:
        """
        Evaluates run output against expected 3-point confirmation rules.
        Returns (passed: bool, score: float [0.0 - 1.0], reason: str).
        """
        is_address = run_output.get("is_address_confirmed", False)
        is_amount = run_output.get("is_amount_confirmed", False)
        is_intent = run_output.get("intent_to_receive", False)
        final_status = run_output.get("status", "")

        expected_status = expected.get("expected_status", "confirmed")

        # 3-Point completeness check
        points_met = sum([bool(is_address), bool(is_amount), bool(is_intent)])
        score = points_met / 3.0

        if expected_status == "confirmed":
            if points_met == 3 and final_status == "confirmed":
                return True, 1.0, "All 3 COD confirmation points validated."
            else:
                missing = []
                if not is_address: missing.append("address")
                if not is_amount: missing.append("amount")
                if not is_intent: missing.append("intent")
                return False, score, f"Guardrail breach: Order confirmed but missing points: {missing}"
        else:
            # Rejection or escalation case
            if final_status in ["rejected", "escalated", "unreachable"]:
                return True, 1.0, f"Correctly rejected/escalated when criteria unmet (status={final_status})."
            return False, 0.0, f"Failed: Expected non-confirmed status, got {final_status}"


class RefundPolicyEvaluator:
    """
    Evaluator for Agent 2 (Customer Support - Refund Guardrail).
    Asserts that refund eligibility strictly honors the 7-day delivery policy.
    Orders > 7 days MUST be rejected with store policy explanation.
    """

    def evaluate(self, run_output: Dict[str, Any], order_days_since_delivery: int) -> Tuple[bool, float, str]:
        is_eligible = run_output.get("is_eligible", False)
        action = run_output.get("action", "")

        if order_days_since_delivery <= 7:
            if is_eligible and action == "ticket_created":
                return True, 1.0, f"Eligible refund correctly approved ({order_days_since_delivery} days <= 7 days)."
            return False, 0.0, f"Failed: Order is within 7 days ({order_days_since_delivery}d) but was not approved."
        else:
            if not is_eligible and action == "rejected_policy":
                return True, 1.0, f"Expired refund correctly blocked ({order_days_since_delivery} days > 7 days)."
            return False, 0.0, f"Guardrail breach: Order delivered {order_days_since_delivery} days ago was approved!"


class CourierOptimizationEvaluator:
    """
    Evaluator for Agent 3 (Shipping Decision Engine).
    Asserts that the selected courier fulfills delivery SLAs, respects high-value
    risk prioritization, and achieves optimal shipping margins.
    """

    def evaluate(
        self,
        selected_courier: str,
        order_total: float,
        destination_city: str,
        expected_courier: str
    ) -> Tuple[bool, float, str]:
        selected_clean = selected_courier.lower().strip()
        expected_clean = expected_courier.lower().strip()

        # High-value risk rule check (> PKR 5,000 must prioritize TCS)
        if order_total >= 5000.0 and selected_clean != "tcs":
            return False, 0.0, f"Risk Rule Breach: High-value order (PKR {order_total}) assigned to {selected_clean} instead of TCS."

        if selected_clean == expected_clean:
            return True, 1.0, f"Optimal courier selected: {selected_clean} matching cost and SLA for {destination_city}."

        return False, 0.5, f"Suboptimal courier: Selected {selected_clean}, expected {expected_clean}."
