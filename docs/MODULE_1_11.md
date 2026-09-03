# Module 1.11 — LangSmith Golden Datasets, Evaluation Benchmarking & Regression CI

## What we built
Module 1.11 establishes automated evaluation benchmarking, golden test datasets, and guardrail evaluators for our specialized AI agents:

1. **Deterministic & Guardrail Evaluators (`backend/observability/evaluators.py`):**
   - **`ConfirmationGuardrailEvaluator`**: Asserts that confirmation status is granted strictly if all three COD criteria (Address + Order Amount + Commitment to Receive) are verified. If any point is missing, flags a `Guardrail breach`.
   - **`RefundPolicyEvaluator`**: Asserts that customer refund requests strictly adhere to the 7-day policy ($\le 7$ days $\rightarrow$ eligible; $> 7$ days $\rightarrow$ strictly rejected with policy explanation).
   - **`CourierOptimizationEvaluator`**: Asserts courier selection logic, enforcing high-value risk prioritization (> PKR 5,000 to TCS) and SLA/cost alignment.
2. **Golden Benchmark Datasets (`backend/observability/benchmark_runner.py`):**
   - Standardized golden ground-truth test cases across Confirmation, Support, and Courier routing scenarios.
3. **Automated Benchmark Runner:**
   - Evaluates multi-agent test suites, calculates pass rates (100.0%), and logs execution latency.
4. **Automated CI Regression Suite (`tests/test_langsmith_eval.py`):**
   - 7 automated tests verifying evaluator accuracy, breach detection on hallucinated runs, and complete benchmark runner execution.

---

## Concepts and decisions

### Why Automated Evaluators in LLM Engineering?
In traditional software engineering, a function either returns `42` or raises an exception.
In generative AI and multi-agent systems, agents return natural language responses. A model might generate an eloquent apology while silently:
- Violating the store's 7-day return policy.
- Confirming an order when the customer actually refused to pay the COD price.
- Selecting an expensive courier that erodes unit margins.

Unit tests cannot catch subtle prompt drifts. **Evaluators** act as semantic quality gates that grade agent responses against business guardrails before code is merged or deployed.

---

## Benchmark Results

```text
======================================================================
         LANGSMITH AGENT BENCHMARK RUNNER SUMMARY
======================================================================
Overall Pass Rate: 100.0%
Total Test Cases:  9
Total Passed:      9
Total Failed:      0
Latency:           0.05ms (Local deterministic evaluation)

Dataset Performance:
  • Confirmation Guardrails:  100.0% Pass Rate (3/3 Cases)
  • Refund Policy Guardrail:  100.0% Pass Rate (3/3 Cases)
  • Courier Optimization:     100.0% Pass Rate (3/3 Cases)
======================================================================
```

---

## Transferable Real-World Use Cases
1. **Compliance & Legal Audits:** Validating that financial advisory or insurance AI bots never make unauthorized investment promises or misquote terms.
2. **Healthcare Triage:** Ensuring patient symptom assessment bots always enforce emergency escalation rules on red-flag symptoms.
3. **CI/CD Quality Gates:** Blocking deployment if a prompt modification reduces agent accuracy below 95%.
