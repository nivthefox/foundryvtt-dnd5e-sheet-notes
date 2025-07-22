# Generate Playwright Tests Command

<instructions>
  <context>
    Write comprehensive Playwright integration tests for character sheet UI workflows. Tests focus on sheet interactions, tab behavior, and data persistence.
  </context>
  
  <requirements>
    - Approved plan for the feature
    - Understanding of sheet UI flow
    - Knowledge of Playwright and foundry-helpers
  </requirements>
  
  <execution>
    1. **Test Structure**
       - Load investigation from `.claude/investigation/issue-{number}.md`
       - Load plan from `.claude/plan/issue-{number}.md`
       - Create test file at `tests/{feature}.spec.js`
       - Import foundry-helpers utilities
       - Plan tests for PC and NPC sheets
       - Cover tab interactions and state persistence
    
    2. **Test Implementation**
       - Test Notes tab appears on both sheet types
       - Test tab switching and content display
       - Test state persistence across sheet closes
       - Test drag-drop interactions
       - Test context menus and dialogs
       - Include edge cases from plan
    
    3. **Local Verification**
       - Save test file
       - Ask user: "Please run `npm test` to confirm tests fail as expected"
       - Debug any setup issues together
       - Proceed to implementation once confirmed
  </execution>
  
  <validation>
    - [ ] PC sheet scenarios covered
    - [ ] NPC sheet scenarios covered
    - [ ] UI interactions tested
    - [ ] State persistence verified
    - [ ] Tests fail appropriately
  </validation>
  
  <examples>
    ```bash
    # Usage
    /test:playwright issue=1
    
    # Creates comprehensive tests:
    # - test('PC Notes tab - visibility and navigation')
    # - test('NPC Notes tab - visibility and navigation')
    # - test('Tab state persistence - PC sheets')
    # - test('Tab state persistence - NPC sheets')
    #
    # Each test covers multiple scenarios
    ```
  </examples>
</instructions>