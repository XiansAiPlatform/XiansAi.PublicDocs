# Workflow Best Practices

Agent flows are essentially Temporal workflows. Therefore usual Temporal workflow best practices apply.

## Determinism

Workflows should be deterministic. This means that the workflow should always produce the same output for the same input.

### Maintaining Determinism

To maintain determinism in workflows, follow these key principles:

#### Use Temporal APIs for Non-Deterministic Operations

- Always use Temporal's built-in APIs for time-based operations, random numbers, and external data access
- Never use system time, random functions, or direct external calls in workflow code
- Temporal APIs ensure these operations are recorded in the event history

#### Avoid Code Changes During Execution

- Once a workflow execution starts, avoid modifying its code
- Use workflow versioning for planned changes
- Implement new features through new activities rather than modifying existing workflow code

#### Handle Versioning Properly

- Use workflow patching APIs for backward compatibility
- Consider worker build ID-based versioning for major changes
- Plan versioning strategy for long-running workflows

#### Common Pitfalls to Avoid

- Don't use system time or random functions directly
- Avoid branching based on external state
- Don't modify workflow code while executions are running
- Never use non-deterministic libraries or functions

Example of incorrect (non-deterministic) code:

```typescript
// Bad: Using system time directly
if (new Date().getHours() < 12) {
    await activities.morningTask();
} else {
    await activities.afternoonTask();
}
```

Example of correct (deterministic) code:

```typescript
// Good: Using Temporal's time API
const currentTime = await workflow.getCurrentTime();
if (currentTime.getHours() < 12) {
    await activities.morningTask();
} else {
    await activities.afternoonTask();
}
```

Read more about determinism in the [Temporal documentation](https://docs.temporal.io/workflows).

## Development Best Practices

### 1. Minimize Business Logic in Workflows

- Keep workflow code focused on orchestration only
- Delegate all business logic to activities
- Ensure workflows remain deterministic
- Use workflows primarily for coordination and flow control

Example:

```typescript
// Good: Workflow only handles orchestration
async function paymentWorkflow(paymentId: string) {
    // Orchestration only
    const status = await activities.initiatePayment(paymentId);
    await activities.logPayment(paymentId, status);
}
```

### 2. Design Activities for Business Logic

- Activities can contain complex business logic
- Activity code changes don't impact workflow determinism
- Activities execute outside workflow's replay scope
- Changes to activity implementation don't require workflow migration

### 3. Use Objects for Arguments

- Avoid passing primitive arguments directly
- Use structured objects for workflow and activity parameters
- Allows for future parameter additions without breaking changes

Example:

```typescript
interface PaymentRequest {
    paymentId: string;
    amount: number;
    currency: string;
    // Extensible for future fields
}
```

### 4. Keep Activities Atomic

- Each activity should perform exactly one task
- Prevents unintended side effects during retries
- Separates concerns for better error handling
- Makes activities more reusable

Example:

```typescript
// Good: Separate atomic activities
async function handlePayment(request: PaymentRequest) {
    await callPaymentAPI(request);
}

async function logPayment(request: PaymentRequest) {
    await logToDatabase(request);
}
```

### 5. Handle Large Data Efficiently

- Avoid passing large data between activities
- Use storage systems for large datasets
- Pass references (like storage keys) instead of full data
- Consider chunking large data processing

Example:

```typescript
// Good: Using storage reference
async function processLargeDataset(storageKey: string) {
    const dataChunk = await loadFromStorage(storageKey);
    await activities.processDataChunk(dataChunk);
}
```

### 6. Prefer Activities Over Child Workflows

- Use activities to start new workflows instead of child workflows
- Child workflows may have limitations with reset features
- Activities provide better control and visibility

### 7. Plan for New Features

- Introduce new functionality as new activities
- Avoid nested patching in workflow code
- Deprecate patches in future versions
- Keep workflow code clean and maintainable

### 8. Error Handling and Retries

- Implement proper retry policies for activities
- Handle transient failures appropriately
- Consider idempotency in activity design
- Use compensation logic when needed

### 9. Testing and Monitoring

- Test activities independently
- Verify workflow orchestration logic
- Monitor activity execution times

Remember that these practices help ensure your agent flows remain scalable, maintainable, and resilient. The focus should be on keeping workflows simple and deterministic while delegating complex business logic to activities.