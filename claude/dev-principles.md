# General Development Principles

## Core Philosophy

**TEST-DRIVEN DEVELOPMENT IS CRITICAL** Every single line of production code must be written in response to a failing test. No exceptions.

## Development Process

### TDD Process

Follow Red-Green-Refactor strictly:

1. **Red**: Write a failing test for the desired behavior. NO PRODUCTION CODE until you have a failing test.
2. **Green**: Write the MINIMUM code to make the test pass. Resist the urge to write more than needed.
3. **Refactor**: Assess the code for improvement opportunities. If refactoring would add value, clean up the code while keeping tests green. If the code is already clean and expressive, move on.
4. **lessons learned**: document in ./lessons-learned.md learnings, gotchas, patterns discovered or any context that would have made the task easier if known upfront.

**Common TDD Violations to Avoid:**
- Writing production code without a failing test first
- Writing multiple tests before making the first one pass
- Writing more production code than needed to pass the current test
- Skipping the refactor assessment step when code could be improved
- Adding functionality "while you're there" without a test driving it

**Remember**: If you're typing production code and there isn't a failing test demanding that code, you're not doing TDD.

### Detailed TDD Practices

#### The Red-Green-Refactor Cycle

**1. Red Phase**
Write a test that fails for the behavior you want to implement. This test:
- Must fail initially (if it passes, the test is wrong or the feature already exists)
- Should test the smallest meaningful behavior
- Must be written before ANY production code

**2. Green Phase**
Write the MINIMUM production code to make the test pass:
- Resist adding functionality not demanded by the current failing test
- The goal is to get to green as quickly as possible
- Ugly code is acceptable at this stage - you'll refactor next

**3. Refactor Phase**
With all tests passing, assess if the code can be improved:
- Only refactor if it adds clear value
- If code is already clean and expressive, move to the next test
- All tests must remain green throughout refactoring

#### Testing Principles

**Behavior-Driven Testing**

- **No "unit tests"** - Tests should verify expected behavior, treating implementation as a black box
- No 1:1 mapping between test files and implementation files
- Tests that examine internal implementation details are wasteful and should be avoided
- **Coverage targets**: 100% coverage expected at all times, but tests must ALWAYS be based on business behavior, not implementation details
- Tests must document expected business behavior

**Test Organization**

Organize tests by business behavior, not by code structure:
```
tests/
  user-authentication.test.js
  shopping-cart-behavior.test.js
  payment-processing.test.js
```

NOT:
```
tests/
  controllers/auth.test.js
  models/user.test.js
  services/payment.test.js
```

**Test Data Patterns**

Use factory functions with optional overrides for test data:
- Always return complete objects with sensible defaults
- Accept optional partial overrides
- Build incrementally - extract nested object factories as needed
- Compose factories for complex objects

Example pattern:
```javascript
const createUser = (overrides = {}) => ({
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides
});
```

**Schema Usage in Tests**

**CRITICAL**: Tests must use real schemas and types from the main project, not redefine their own.

**Implementation:**
- All domain schemas should be exported from a shared schema package or module
- Test files should import schemas from the shared location
- If a schema isn't exported yet, add it to the exports rather than duplicating it
- Mock data factories should use the real types derived from real schemas

#### Common TDD Patterns

**Testing External APIs**

Test the behavior your code exhibits in response to API calls:
- Test successful responses
- Test error handling
- Test timeout scenarios
- Focus on your code's behavior, not the API itself

**Testing Async Code**

- Test the eventual behavior, not the promise mechanics
- Test both success and failure paths
- Test concurrent operations when relevant

**Testing Error Cases**

Every happy path test should have corresponding error tests:
- Invalid inputs
- Missing required data
- System failures
- Edge cases

#### TDD Workflow Examples

**Example: Adding a New Feature**

1. **Identify the behavior** - "Users can add items to their shopping cart"
2. **Write the test** - Test that adding an item increases cart count
3. **Run test (RED)** - Verify it fails
4. **Implement minimally** - Just enough code to pass
5. **Run test (GREEN)** - Verify it passes
6. **Assess for refactoring** - Is the code clear? Can it be improved?
7. **Next behavior** - "Users can't add out-of-stock items"
8. **Repeat cycle**

**Example: Fixing a Bug**

1. **Write a failing test** that reproduces the bug
2. **Verify the test fails** for the right reason
3. **Fix the bug** with minimal changes
4. **Verify the test passes**
5. **Run all tests** to ensure no regression
6. **Refactor if needed**

#### Coverage Philosophy

100% test coverage is expected, but coverage must come from testing business behaviors:

✅ **Good Coverage:**
- Testing all user-facing features
- Testing all error scenarios users might encounter
- Testing all business rules and validations

❌ **Bad Coverage:**
- Testing getters/setters
- Testing private methods directly
- Testing implementation details
- Writing tests just to increase coverage numbers

#### Anti-Patterns to Avoid

**Testing Implementation**
```javascript
// ❌ BAD: Testing implementation
test('uses array.reduce to sum values', () => {
  const spy = jest.spyOn(Array.prototype, 'reduce');
  calculateTotal([1, 2, 3]);
  expect(spy).toHaveBeenCalled();
});

// ✅ GOOD: Testing behavior
test('calculates sum of all values', () => {
  expect(calculateTotal([1, 2, 3])).toBe(6);
});
```

**Writing Multiple Tests Before Green**
```javascript
// ❌ BAD: Writing many tests at once
test('validates email format', () => { ... });
test('requires @ symbol', () => { ... });
test('requires domain', () => { ... });
test('rejects multiple @ symbols', () => { ... });

// ✅ GOOD: One test at a time through red-green-refactor
```

**Over-Engineering Based on Future Needs**
```javascript
// ❌ BAD: Adding unneeded flexibility
function createValidator(rules, strategies, validators, config) { ... }

// ✅ GOOD: Simple solution for current test
function validateEmail(email) { ... }
```

### Refactoring

After achieving a green state and committing your work, you MUST assess whether the code can be improved. However, only refactor if there's clear value - if the code is already clean and expresses intent well, move on to the next test.

### Comprehensive Refactoring Practices

#### What is Refactoring?

Refactoring is the process of improving code structure without changing its external behavior. It's the third step in the TDD cycle, where you make code better after it's working.

#### When to Refactor

**Always Assess After Green**
Once tests pass, before moving to the next test, evaluate if refactoring would add value.

**Refactor When You See:**
- **Duplication of knowledge** (not just similar-looking code)
- **Unclear names** - Variable, function, or class names that don't express intent
- **Complex structures** - Deeply nested code, long functions, complex conditionals
- **Emerging patterns** - Similar solutions appearing multiple times

**When NOT to Refactor:**
- Code is already clean and expressive
- The "improvement" would make code more complex
- You're speculating about future needs
- The change would alter external behavior

#### Core Refactoring Principles

**1. Commit Before Refactoring**
Always commit your working code before starting any refactoring. This gives you a safe point to return to.

**2. Maintain External Behavior**
Refactoring must NEVER change what the code does from an external perspective. All tests must continue to pass without modification.

**3. Small, Incremental Steps**
Make one small change at a time. Run tests after each change to ensure nothing broke.

#### Understanding DRY (Don't Repeat Yourself)

DRY is about removing duplication of **knowledge**, not duplication of code.

**Knowledge Duplication (Remove This):**
```javascript
// ❌ BAD: Business rule duplicated
function calculateEmployeeBonus(salary) {
  if (salary > 50000) return salary * 0.1;
  return salary * 0.05;
}

function isEligibleForPremiumBenefits(salary) {
  return salary > 50000; // Same threshold knowledge
}

// ✅ GOOD: Single source of truth
const PREMIUM_SALARY_THRESHOLD = 50000;

function calculateEmployeeBonus(salary) {
  if (salary > PREMIUM_SALARY_THRESHOLD) return salary * 0.1;
  return salary * 0.05;
}

function isEligibleForPremiumBenefits(salary) {
  return salary > PREMIUM_SALARY_THRESHOLD;
}
```

**Code Duplication (Sometimes OK):**
```javascript
// ✅ OK: Similar structure, different purposes
function validateUsername(username) {
  if (!username) throw new Error('Username required');
  if (username.length < 3) throw new Error('Username too short');
}

function validatePassword(password) {
  if (!password) throw new Error('Password required');
  if (password.length < 8) throw new Error('Password too short');
}
// These look similar but represent different business rules
```

#### Common Refactoring Patterns

**Extract Function**
When code does one thing but it's mixed with other concerns:
```javascript
// Before
function processOrder(order) {
  // Calculate total
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  
  // Apply discount
  if (order.customer.isPremium) {
    total *= 0.9;
  }
  
  return total;
}

// After
function processOrder(order) {
  const total = calculateTotal(order.items);
  return applyCustomerDiscount(total, order.customer);
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function applyCustomerDiscount(total, customer) {
  return customer.isPremium ? total * 0.9 : total;
}
```

**Rename for Clarity**
```javascript
// Before
function calc(x, y) {
  return x * y * 0.1;
}

// After
function calculateCommission(saleAmount, commissionRate) {
  return saleAmount * commissionRate * 0.1;
}
```

**Replace Magic Numbers**
```javascript
// Before
if (user.age >= 65) {
  applyDiscount(0.15);
}

// After
const SENIOR_AGE_THRESHOLD = 65;
const SENIOR_DISCOUNT_RATE = 0.15;

if (user.age >= SENIOR_AGE_THRESHOLD) {
  applyDiscount(SENIOR_DISCOUNT_RATE);
}
```

#### Refactoring Workflow

**Step-by-Step Process**

1. **Identify the smell** - What makes this code hard to understand or maintain?
2. **Verify tests are green** - Never refactor with failing tests
3. **Make one small change** - Extract a function, rename a variable, etc.
4. **Run tests** - Ensure behavior hasn't changed
5. **Commit if improved** - Lock in each successful refactoring
6. **Repeat or stop** - Continue if more improvements are possible

**Verification Checklist**

Before considering refactoring complete:
- [ ] The refactoring actually improves the code
- [ ] All tests still pass without modification
- [ ] All static analysis tools pass (linting)
- [ ] Code is more readable than before
- [ ] Any duplication removed was duplication of knowledge
- [ ] No speculative abstractions were created

#### When to Stop Refactoring

**Good Enough is Good Enough**
Not all code needs to be perfect. Stop when:
- The code clearly expresses its intent
- It's easy to understand and modify
- There are no obvious improvements left
- Further changes would add complexity without benefit

**Avoid Over-Engineering**
```javascript
// ❌ BAD: Over-abstracted
class AbstractValidatorFactory {
  createValidator(type) {
    return new ValidatorBuilder()
      .withStrategy(this.strategies[type])
      .withRules(this.rules[type])
      .build();
  }
}

// ✅ GOOD: Simple and clear
function validateEmail(email) {
  return email.includes('@') && email.includes('.');
}
```

#### Examples of Refactoring Decisions

**Example 1: When to Refactor**
```javascript
// Current code after making test pass
function calculatePrice(item, user) {
  let price = item.basePrice;
  if (user.membershipLevel === 'gold') {
    price = price * 0.8;
  } else if (user.membershipLevel === 'silver') {
    price = price * 0.9;
  }
  if (item.category === 'electronics' && user.membershipLevel === 'gold') {
    price = price * 0.95;
  }
  return price;
}

// Worth refactoring because:
// - Complex conditional logic
// - Membership discounts could be extracted
// - Category-specific rules are mixed with membership rules
```

**Example 2: When NOT to Refactor**
```javascript
// Current code after making test pass
function isValidAge(age) {
  return age >= 18 && age <= 100;
}

// This is fine as-is because:
// - It's already clear and simple
// - The function name explains the purpose
// - No duplication or complexity to remove
```

#### Common Refactoring Mistakes

**Creating Unnecessary Abstractions**
Don't create abstractions until you have multiple concrete examples showing the pattern.

**Refactoring Without Tests**
Never refactor code that isn't covered by tests. Write tests first if needed.

**Changing Behavior**
If you have to modify tests after refactoring, you've changed behavior, not just structure.

**Refactoring Too Much at Once**
Large refactorings are risky. Break them into small, safe steps.

## Code Principles

### Clean Code Practices

- **No comments in code.** Swagger is the only exception. Code should be self-documenting through clear naming and structure.
- **Keep functions small** - If a function doesn't fit in 100 lines, it's too long
- **Use descriptive names** - A longer descriptive name is better than a short cryptic one

### Structure and Organization

- **Prefer options objects over positional parameters** - Better for readability and future extensibility
- **Extract complex conditionals** - Give them descriptive names
- **Avoid else clauses when possible** - Use early returns instead

### Error Handling

- Throw errors liberally for exceptional cases
- Let errors bubble up to appropriate handlers
- Don't catch errors unless you can handle them meaningfully

## Development Workflow

### Commits

- Commit working code before refactoring (safety net)
- Commit refactoring separately from feature changes
- Write clear short commit messages that explain the "why"
