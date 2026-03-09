# ClaudeNest Testing Guide

This guide explains how to run and write tests for the ClaudeNest project.

## Table of Contents

- [Overview](#overview)
- [Backend Testing (PHPUnit)](#backend-testing-phpunit)
- [Frontend Testing (Vitest)](#frontend-testing-vitest)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)

---

## Overview

ClaudeNest uses two testing frameworks:

- **Backend (PHP)**: PHPUnit for Laravel tests
- **Frontend (Vue.js)**: Vitest for component and composable tests

### Test Coverage Requirements

- Minimum **80%** code coverage for critical paths
- All API endpoints must have feature tests
- All business logic services must have unit tests
- All Vue components with logic must have tests

---

## Backend Testing (PHPUnit)

### Running Tests

```bash
# Navigate to server directory
cd packages/server

# Run all tests
php artisan test

# Run specific test suite
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit

# Run specific test file
php artisan test --filter=MachineApiTest

# Run with coverage
php artisan test --coverage

# Run with coverage and minimum threshold
php artisan test --coverage --min=80
```

### Test Structure

```
tests/
├── TestCase.php              # Base test case with helper methods
├── CreatesApplication.php    # Application bootstrapper
├── Feature/                  # Feature tests (API endpoints)
│   ├── Auth/
│   │   └── AuthenticationTest.php
│   └── Api/
│       ├── MachineApiTest.php
│       ├── SessionApiTest.php
│       ├── ProjectApiTest.php
│       ├── TaskApiTest.php
│       └── FileLockApiTest.php
└── Unit/                     # Unit tests (services, policies)
    ├── Services/
    │   ├── EmbeddingServiceTest.php
    │   └── ContextRAGServiceTest.php
    └── Policies/
        └── MachinePolicyTest.php
```

### Writing Feature Tests

Feature tests test HTTP endpoints and full application flow.

```php
<?php

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_list_their_resources(): void
    {
        // Arrange: Create test data
        $user = User::factory()->create();
        $machines = Machine::factory()->count(3)->for($user)->create();

        // Act: Make API request
        $response = $this->actingAs($user)
            ->getJson('/api/machines');

        // Assert: Verify response
        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'data');
    }

    /** @test */
    public function unauthorized_user_cannot_access_resources(): void
    {
        $response = $this->getJson('/api/machines');

        $response->assertStatus(401);
    }
}
```

### Writing Unit Tests

Unit tests test individual classes in isolation.

```php
<?php

namespace Tests\Unit\Services;

use App\Services\YourService;
use Tests\TestCase;
use Mockery;

class YourServiceTest extends TestCase
{
    private YourService $service;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = new YourService();
    }

    /** @test */
    public function it_performs_expected_operation(): void
    {
        // Arrange
        $input = 'test input';

        // Act
        $result = $this->service->process($input);

        // Assert
        $this->assertEquals('expected output', $result);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
```

### Available Factories

Use factories to create test data:

```php
// Users
$user = User::factory()->create();
$unverified = User::factory()->unverified()->create();

// Machines
$machine = Machine::factory()->for($user)->create();
$offline = Machine::factory()->offline()->create();

// Sessions
$session = Session::factory()->for($machine)->for($user)->create();
$completed = Session::factory()->completed()->create();

// Projects
$project = SharedProject::factory()->for($user)->for($machine)->create();

// Tasks
$task = SharedTask::factory()->for($project)->create();
$claimed = SharedTask::factory()->claimed()->create();
$completed = SharedTask::factory()->completed()->create();

// File Locks
$lock = FileLock::factory()->for($project)->create();
$expired = FileLock::factory()->expired()->create();
```

### Helper Methods (TestCase.php)

```php
// Authenticate as user
$this->actingAsUser();
$this->actingAsUser($specificUser);

// Assert standard JSON structure
$this->assertStandardJsonStructure($response, ['data' => [...]]);

// Assert error response
$this->assertErrorResponse($response, 404, 'NOT_FOUND');
```

### Testing Best Practices

1. **Use descriptive test names**: `user_can_create_machine_with_valid_data`
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **One assertion per test** (or related assertions)
4. **Use factories** instead of manual model creation
5. **Test edge cases**: empty data, invalid input, authorization
6. **Don't test framework code**: Only test custom logic
7. **Keep tests fast**: Use in-memory SQLite for tests
8. **Clean up after tests**: Use RefreshDatabase trait

---

## Frontend Testing (Vitest)

### Running Tests

```bash
# Navigate to server directory
cd packages/server

# Install dependencies first (if not done)
npm install

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Test Structure

```
resources/js/
└── __tests__/
    ├── setup.ts              # Test setup and mocks
    ├── components/           # Component tests
    │   └── Modal.spec.ts
    ├── composables/          # Composable tests
    │   └── useApi.spec.ts
    └── stores/               # Store tests
        └── auth.spec.ts
```

### Writing Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from '@/components/MyComponent.vue';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: {
        title: 'Test Title',
      },
    });

    expect(wrapper.text()).toContain('Test Title');
  });

  it('emits event when button clicked', async () => {
    const wrapper = mount(MyComponent);

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('buttonClick')).toBeTruthy();
  });

  it('renders slot content', () => {
    const wrapper = mount(MyComponent, {
      slots: {
        default: '<p>Slot content</p>',
      },
    });

    expect(wrapper.html()).toContain('Slot content');
  });
});
```

### Writing Composable Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMyComposable } from '@/composables/useMyComposable';

describe('useMyComposable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct values', () => {
    const { value, isReady } = useMyComposable();

    expect(value.value).toBeNull();
    expect(isReady.value).toBe(false);
  });

  it('fetches data correctly', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    const { fetchData, value } = useMyComposable();
    await fetchData();

    expect(value.value).toEqual({ data: 'test' });
  });
});
```

### Writing Store Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMyStore } from '@/stores/myStore';

describe('MyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with correct state', () => {
    const store = useMyStore();

    expect(store.items).toEqual([]);
    expect(store.isLoading).toBe(false);
  });

  it('adds item correctly', () => {
    const store = useMyStore();
    const item = { id: 1, name: 'Test' };

    store.addItem(item);

    expect(store.items).toContain(item);
    expect(store.items).toHaveLength(1);
  });

  it('computed values update correctly', () => {
    const store = useMyStore();
    
    expect(store.itemCount).toBe(0);
    
    store.addItem({ id: 1, name: 'Test' });
    
    expect(store.itemCount).toBe(1);
  });
});
```

### Mocking in Tests

#### Mock fetch API

```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
});
```

#### Mock localStorage

```typescript
// Already mocked in setup.ts
localStorage.setItem('key', 'value');
expect(localStorage.setItem).toHaveBeenCalledWith('key', 'value');
```

#### Mock Vue Router

```typescript
import { createRouter, createMemoryHistory } from 'vue-router';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomeComponent },
  ],
});

const wrapper = mount(Component, {
  global: {
    plugins: [router],
  },
});
```

### Testing Best Practices

1. **Test behavior, not implementation**: Test what the component does, not how
2. **Use data-testid**: Add `data-testid="element-name"` for reliable selectors
3. **Avoid snapshot tests**: They're brittle and don't test behavior
4. **Mock external dependencies**: APIs, stores, routers
5. **Test user interactions**: Clicks, inputs, form submissions
6. **Test error states**: Loading, error messages, edge cases
7. **Keep tests simple**: One concept per test
8. **Use meaningful assertions**: Specific expectations, not just "exists"

---

## Writing Tests

### Test Naming Convention

- Use descriptive names: `it_performs_expected_action`
- Use underscores for readability
- Start with subject: `user_can_...`, `it_validates_...`
- Be specific: What is being tested and expected outcome

### What to Test

**DO TEST:**
- ✅ API endpoints (authorization, validation, responses)
- ✅ Business logic (services, computations)
- ✅ Component behavior (props, events, slots)
- ✅ Store actions and mutations
- ✅ Edge cases and error handling
- ✅ User interactions

**DON'T TEST:**
- ❌ Framework functionality (Laravel, Vue internals)
- ❌ Third-party libraries
- ❌ Trivial getters/setters without logic
- ❌ Private methods (test through public interface)

### Test Organization

```php
/** @test */
public function descriptive_test_name(): void
{
    // Arrange: Set up test data
    $user = User::factory()->create();
    
    // Act: Perform the action
    $response = $this->actingAs($user)->getJson('/api/resource');
    
    // Assert: Verify the outcome
    $response->assertOk();
    $this->assertDatabaseHas('table', ['key' => 'value']);
}
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.3
          extensions: pdo, pgsql
      
      - name: Install Dependencies
        run: |
          cd packages/server
          composer install --prefer-dist --no-interaction
      
      - name: Run Tests
        run: |
          cd packages/server
          php artisan test --coverage --min=80

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install Dependencies
        run: |
          cd packages/server
          npm ci
      
      - name: Run Tests
        run: |
          cd packages/server
          npm run test:coverage
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running tests..."

cd packages/server

# Run PHP tests
php artisan test
if [ $? -ne 0 ]; then
    echo "❌ PHP tests failed"
    exit 1
fi

# Run JS tests
npm run test:run
if [ $? -ne 0 ]; then
    echo "❌ JS tests failed"
    exit 1
fi

echo "✅ All tests passed"
```

---

## Debugging Tests

### PHPUnit

```bash
# Run with verbose output
php artisan test --verbose

# Stop on first failure
php artisan test --stop-on-failure

# Filter tests by method name
php artisan test --filter=test_user_can_login
```

### Vitest

```bash
# Run in debug mode (shows console.log)
npm test -- --reporter=verbose

# Run single test file
npm test -- Modal.spec.ts

# Run with debugger (add debugger; in test)
node --inspect-brk ./node_modules/.bin/vitest
```

---

## Troubleshooting

### Common Issues

**Database not refreshed between tests**
- Make sure you're using `RefreshDatabase` trait
- Check `phpunit.xml` has correct DB config

**Tests failing in CI but passing locally**
- Check environment variables
- Verify dependencies are installed
- Check PHP/Node versions match

**Frontend tests can't find modules**
- Check Vitest config alias matches tsconfig
- Verify imports use `@/` prefix correctly

**Mocks not working**
- Clear mocks in `beforeEach`
- Verify mock setup before test execution

---

## Resources

- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [Laravel Testing Guide](https://laravel.com/docs/testing)
- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Questions?

If you have questions about testing:
1. Check this guide first
2. Look at existing test examples
3. Ask the team in #testing channel
4. Review official documentation
