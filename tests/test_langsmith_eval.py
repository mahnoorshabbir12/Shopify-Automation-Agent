import pytest

from backend.observability.benchmark_runner import benchmark_runner
from backend.observability.evaluators import (
    ConfirmationGuardrailEvaluator,
    CourierOptimizationEvaluator,
    RefundPolicyEvaluator,
)


def test_confirmation_evaluator_full_agreement():
    """Verify evaluator grants 1.0 pass when address, amount, and intent are satisfied."""
    evaluator = ConfirmationGuardrailEvaluator()
    output = {
        "status": "confirmed",
        "is_address_confirmed": True,
        "is_amount_confirmed": True,
        "intent_to_receive": True
    }
    passed, score, reason = evaluator.evaluate(output, {"expected_status": "confirmed"})
    assert passed is True
    assert score == 1.0
    assert "validated" in reason


def test_confirmation_evaluator_missing_intent_breach():
    """Verify evaluator flags guardrail breach when intent is missing despite confirmed status."""
    evaluator = ConfirmationGuardrailEvaluator()
    output = {
        "status": "confirmed",
        "is_address_confirmed": True,
        "is_amount_confirmed": True,
        "intent_to_receive": False  # Missing intent!
    }
    passed, score, reason = evaluator.evaluate(output, {"expected_status": "confirmed"})
    assert passed is False
    assert score < 1.0
    assert "Guardrail breach" in reason


def test_refund_evaluator_valid_window():
    """Verify refund requested within 7 days is marked passing."""
    evaluator = RefundPolicyEvaluator()
    output = {"is_eligible": True, "action": "ticket_created"}
    passed, score, _ = evaluator.evaluate(output, order_days_since_delivery=4)
    assert passed is True
    assert score == 1.0


def test_refund_evaluator_expired_window_blocked():
    """Verify refund requested after 14 days is blocked according to policy."""
    evaluator = RefundPolicyEvaluator()
    output = {"is_eligible": False, "action": "rejected_policy"}
    passed, score, reason = evaluator.evaluate(output, order_days_since_delivery=14)
    assert passed is True
    assert score == 1.0
    assert "correctly blocked" in reason


def test_refund_evaluator_breach_detection():
    """Verify evaluator catches when an LLM agent erroneously approves an expired return."""
    evaluator = RefundPolicyEvaluator()
    # Simulated hallucination where agent approves a 20-day-old return
    output = {"is_eligible": True, "action": "ticket_created"}
    passed, score, reason = evaluator.evaluate(output, order_days_since_delivery=20)
    assert passed is False
    assert score == 0.0
    assert "Guardrail breach" in reason


def test_courier_evaluator_high_value_rule():
    """Verify evaluator enforces TCS courier selection for high-value orders (> PKR 5,000)."""
    evaluator = CourierOptimizationEvaluator()

    # Valid TCS selection for PKR 6,200
    passed, score, _ = evaluator.evaluate(
        selected_courier="tcs",
        order_total=6200.0,
        destination_city="Karachi",
        expected_courier="tcs"
    )
    assert passed is True
    assert score == 1.0

    # Breach: PKR 7,500 order assigned to blueex
    breach_passed, breach_score, reason = evaluator.evaluate(
        selected_courier="blueex",
        order_total=7500.0,
        destination_city="Karachi",
        expected_courier="tcs"
    )
    assert breach_passed is False
    assert breach_score == 0.0
    assert "Risk Rule Breach" in reason


def test_benchmark_runner_complete_suite():
    """Run full benchmark runner suite across Confirmation, Refund, and Shipping datasets."""
    summary = benchmark_runner.run_all_benchmarks()
    assert summary["overall_pass_rate_percent"] == 100.0
    assert summary["total_evaluations"] >= 9
    assert summary["total_passed"] == summary["total_evaluations"]
    assert "datasets" in summary
    assert summary["latency_ms"] >= 0.0
