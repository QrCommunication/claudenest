---
name: testing
description: Testing patterns and best practices for reliable software
version: 1.0.0
category: general
author: ClaudeNest
tags: [testing, tdd, unit-tests, integration-tests]
---

# Testing Patterns and Best Practices

A comprehensive guide to writing effective tests that ensure software quality and reliability.

## Testing Pyramid

```
      /\
     /  \
    / E2E \        <- Few tests, high confidence
   /--------\
  / Integration\   <- Medium tests, medium confidence
 /--------------\
/   Unit Tests   \ <- Many tests, fast feedback
------------------
```

## Test Types

### Unit Tests
- Test individual functions/methods in isolation
- Fast execution (< 10ms per test)
- No external dependencies (mocked)
- High coverage of code paths

```python
# Python - pytest
def test_calculate_total():
    items = [Item(price=10), Item(price=20)]
    assert calculate_total(items) == 30

def test_empty_cart():
    assert calculate_total([]) == 0
```

```javascript
// JavaScript - Jest
describe('calculateTotal', () => {
  test('sums item prices', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });

  test('returns 0 for empty cart', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```

### Integration Tests
- Test component interactions
- May use real dependencies
- Slower than unit tests
- Test data flow between modules

```python
# Testing database integration
def test_create_user_with_database():
    user = UserService.create_user({
        'email': 'test@example.com',
        'name': 'Test User'
    })
    
    # Verify in database
    db_user = db.query(User).filter_by(email='test@example.com').first()
    assert db_user is not None
    assert db_user.name == 'Test User'
```

### End-to-End Tests
- Test complete user flows
- Use real browser/application
- Slowest but highest confidence
- Critical path testing

```javascript
// Cypress
it('completes checkout flow', () => {
  cy.visit('/products');
  cy.get('[data-testid="add-to-cart"]').first().click();
  cy.get('[data-testid="cart"]').click();
  cy.get('[data-testid="checkout"]').click();
  cy.url().should('include', '/checkout');
});
```

## TDD: Test-Driven Development

### Red-Green-Refactor Cycle

1. **Red** - Write a failing test
2. **Green** - Write minimal code to pass
3. **Refactor** - Improve code while keeping tests green

```python
# Step 1: Write failing test (Red)
def test_fizzbuzz_returns_fizz_for_3():
    assert fizzbuzz(3) == "Fizz"

# Step 2: Minimal implementation (Green)
def fizzbuzz(n):
    if n == 3:
        return "Fizz"
    return str(n)

# Step 3: Refactor and add more cases
def fizzbuzz(n):
    result = ""
    if n % 3 == 0:
        result += "Fizz"
    if n % 5 == 0:
        result += "Buzz"
    return result or str(n)
```

## Testing Best Practices

### 1. Arrange-Act-Assert (AAA)
```python
def test_user_can_update_profile():
    # Arrange
    user = create_user(name="Old Name")
    
    # Act
    result = user.update_profile(name="New Name")
    
    # Assert
    assert result.is_success
    assert user.name == "New Name"
```

### 2. One Assert Per Test (Usually)
```python
# Good - focused test
def test_validation_fails_for_empty_email():
    result = validate_email("")
    assert result.error == "Email is required"

# Avoid - multiple unrelated asserts
def test_user_creation():
    user = create_user()
    assert user.id is not None
    assert user.created_at is not None
    assert user.email_verified is False
```

### 3. Use Descriptive Test Names
```python
# Good
def test_calculate_total_returns_zero_for_empty_cart()

# Avoid
def test_calc_1()
```

### 4. Test Edge Cases
- Empty inputs
- Maximum values
- Null/undefined values
- Boundary conditions
- Invalid types

## Mocking

### When to Mock
- External API calls
- Database interactions (in unit tests)
- File system operations
- Time-dependent code

### Python - unittest.mock
```python
from unittest.mock import Mock, patch

@patch('requests.get')
def test_fetch_user_data(mock_get):
    mock_get.return_value.json.return_value = {'name': 'John'}
    
    result = fetch_user_data(1)
    
    assert result['name'] == 'John'
    mock_get.assert_called_once_with('https://api.example.com/users/1')
```

### JavaScript - Jest
```javascript
jest.mock('./api');

test('fetches user data', async () => {
  api.getUser.mockResolvedValue({ name: 'John' });
  
  const result = await fetchUserData(1);
  
  expect(result.name).toBe('John');
  expect(api.getUser).toHaveBeenCalledWith(1);
});
```

## Test Coverage

### Coverage Goals
- **Lines**: 80%+ for critical code
- **Branches**: 70%+ for complex logic
- **Functions**: 90%+

### Coverage Tools
- **Python**: pytest-cov
- **JavaScript**: nyc / jest --coverage
- **PHP**: PHPUnit with Xdebug

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          npm install
          npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Common Testing Anti-Patterns

1. **Testing Implementation Details** - Test behavior, not internals
2. **Brittle Tests** - Avoid hardcoding specific values
3. **Slow Tests** - Keep unit tests fast (< 100ms)
4. **Ignored Tests** - Fix or remove skipped tests
5. **Testing Third-Party Code** - Trust library authors
