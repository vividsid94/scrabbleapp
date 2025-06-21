# Play.js Unit Tests

This directory contains comprehensive unit tests for the Play.js component and related Zustand store.

## Test Files

- `Play.test.js` - Tests for the Play component
- `../stores/__tests__/gameStore.test.js` - Tests for the Zustand game store

## Running Tests

### Run all tests
```bash
npm test
```

### Run only Play.js tests
```bash
npm test -- --testPathPattern=Play.test.js
```

### Run only store tests
```bash
npm test -- --testPathPattern=gameStore.test.js
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

## What the Tests Cover

### Play.test.js
- **Rendering**: Component renders correctly with different states
- **User Interactions**: Button clicks, board interactions, tile operations
- **Zustand Integration**: Store state updates and actions
- **Effects & Lifecycle**: useEffect hooks, event listeners, cleanup
- **Error Handling**: Graceful handling of errors and edge cases
- **Performance**: Memoization and optimization

### gameStore.test.js
- **Initial State**: Correct default values
- **State Management**: All state setters and getters
- **Computed Values**: Dynamic calculations based on state
- **Game Actions**: Complex game logic functions
- **UI State**: Modal, snackbar, victory states
- **Simulation State**: Heat maps, progress, results
- **Error Handling**: Invalid state updates
- **Performance**: Efficient state updates

## Test Structure

### Mocking Strategy
- **Zustand Store**: Mocked to isolate component testing
- **Child Components**: Mocked to focus on Play.js logic
- **External Dependencies**: Sound functions, static data, API calls
- **Browser APIs**: Event listeners, timers

### Test Categories
1. **Rendering Tests**: Verify UI elements appear correctly
2. **Interaction Tests**: Test user actions and callbacks
3. **State Tests**: Verify Zustand store integration
4. **Effect Tests**: Test useEffect hooks and side effects
5. **Error Tests**: Test error handling and edge cases
6. **Performance Tests**: Test optimization and efficiency

## Benefits of This Testing Approach

### Before Zustand Migration
- Complex state management scattered across component
- Difficult to test individual pieces of logic
- Tight coupling between UI and business logic
- Hard to mock and isolate functionality

### After Zustand Migration
- **Separation of Concerns**: UI logic separate from business logic
- **Easy Mocking**: Store can be easily mocked for component tests
- **Focused Testing**: Each piece can be tested independently
- **Better Coverage**: More comprehensive test coverage possible
- **Maintainable**: Tests are easier to write and maintain

## Test Coverage Goals

- **Play.js**: 90%+ coverage of rendering and interaction logic
- **Game Store**: 95%+ coverage of state management and actions
- **Integration**: Full coverage of component-store integration

## Debugging Tests

### Common Issues
1. **Mock not working**: Check mock implementation matches actual usage
2. **Async operations**: Use `waitFor` for async state updates
3. **Event listeners**: Ensure proper cleanup in tests
4. **Zustand state**: Reset store state between tests

### Debug Commands
```bash
# Run specific test with verbose output
npm test -- --verbose --testNamePattern="renders without crashing"

# Run tests with debugger
npm test -- --runInBand --detectOpenHandles
```

## Adding New Tests

### For New Features
1. Add rendering tests for new UI elements
2. Add interaction tests for new user actions
3. Add state tests for new Zustand actions
4. Add integration tests for component-store interaction

### For Bug Fixes
1. Add regression tests that would catch the bug
2. Test both the fix and edge cases
3. Ensure existing functionality still works

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how
2. **Use Descriptive Test Names**: Clear names that explain what's being tested
3. **Arrange-Act-Assert**: Structure tests with clear sections
4. **Mock External Dependencies**: Don't test third-party code
5. **Test Edge Cases**: Include error conditions and boundary cases
6. **Keep Tests Fast**: Avoid slow operations in tests
7. **Maintain Test Data**: Use realistic but simple test data 