---
name: debugging
description: Best practices for debugging code and troubleshooting issues
version: 1.0.0
category: general
author: ClaudeNest
tags: [debugging, troubleshooting, errors]
---

# Debugging Best Practices

This skill provides comprehensive guidance for debugging code effectively across different programming languages and environments.

## Core Principles

### 1. Reproduce the Issue
- Create a minimal reproducible example
- Document exact steps to trigger the bug
- Note environmental factors (OS, versions, dependencies)

### 2. Isolate the Problem
- Use binary search to narrow down the cause
- Comment out code sections systematically
- Create test cases that pass and fail

### 3. Gather Information
- Read error messages carefully
- Check logs and stack traces
- Use debugging tools (breakpoints, inspectors)

## Debugging Techniques

### Print Debugging
```python
# Add strategic print statements
print(f"Value of x at line 42: {x}")
print(f"Function called with args: {args}, kwargs: {kwargs}")
```

### Using a Debugger
```python
# Python - pdb
import pdb; pdb.set_trace()

# JavaScript - debugger
debugger;

# Add breakpoints in IDE
# Step through code execution
# Inspect variable values
```

### Logging
```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug("Detailed information")
logger.info("General information")
logger.warning("Warning message")
logger.error("Error occurred")
```

## Common Bug Patterns

| Pattern | Symptom | Solution |
|---------|---------|----------|
| Off-by-one | Loop runs one too many/few times | Check boundary conditions |
| Null reference | Crash on accessing property | Add null checks |
| Race condition | Intermittent failures | Add synchronization |
| Memory leak | Gradual slowdown | Check resource cleanup |
| Type mismatch | Unexpected behavior | Validate input types |

## Language-Specific Tips

### JavaScript/TypeScript
- Use `console.table()` for arrays/objects
- Leverage browser DevTools
- Check for async/await issues
- Watch for closure captures

### Python
- Use `pdb` or `ipdb` for interactive debugging
- Leverage f-strings for better logging
- Check for mutable default arguments
- Watch for GIL issues in threading

### PHP
- Use `var_dump()` with `die()` for quick checks
- Check `error_log` for details
- Enable display_errors in development
- Use Xdebug for step debugging

## Best Practices

1. **Stay Calm** - Don't panic; methodical approach wins
2. **Take Breaks** - Fresh eyes spot issues faster
3. **Read Documentation** - Check official docs first
4. **Search First** - Someone may have solved it
5. **Document Solutions** - Write down what fixed it
6. **Add Tests** - Prevent regression with tests

## Debugging Checklist

- [ ] Can I reproduce the bug consistently?
- [ ] Have I checked the most recent changes?
- [ ] Are there any error messages or logs?
- [ ] Have I isolated the problematic code?
- [ ] Have I checked for recent dependency updates?
- [ ] Does the issue occur in a clean environment?
- [ ] Have I consulted team members or documentation?
