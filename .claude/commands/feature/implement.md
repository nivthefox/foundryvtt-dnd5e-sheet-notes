# Implement Feature Command

<instructions>
  <context>
    Implement character sheet enhancements based on approved plan and failing tests. Automatically uses investigation notes and plan from `.claude/` directories.
  </context>
  
  <requirements>
    - Completed investigation in `.claude/investigation/issue-{number}.md`
    - Approved plan in `.claude/plan/issue-{number}.md`
    - Failing Playwright tests
    - User available for testing
  </requirements>
  
  <execution>
    1. **Review Context**
       - Load investigation from `.claude/investigation/issue-{number}.md`
       - Load approved plan from `.claude/plan/issue-{number}.md`
       - Review failing tests to understand requirements
       - Identify implementation order
    
    2. **Implementation**
       - Never try to update a file you have not read first
       - Follow the approved plan exactly
       - Use lib-wrapper for sheet modifications
       - Implement tab/UI changes per plan
       - Handle data persistence correctly
       - Follow D&D 5e system patterns
    
    3. **Incremental Testing**
       - After each component, ask user to test in Foundry
       - Check tab rendering and switching
       - Verify state persistence
       - Fix issues as they arise
    
    4. **Final Validation**
       - Run `npm run build` to ensure no errors
       - Run `npm run lint` for code quality
       - Ask user to test with PC and NPC sheets
       - Verify all requirements are met
  </execution>
  
  <validation>
    - [ ] All tests pass
    - [ ] Build and lint succeed
    - [ ] Feature works on PC sheets
    - [ ] Feature works on NPC sheets
    - [ ] State persists correctly
    - [ ] No console errors
  </validation>
  
  <examples>
    ```bash
    # Usage
    /feature:implement issue=1
    
    # Automatically loads:
    # - .claude/investigation/issue-1.md
    # - .claude/plan/issue-1.md
    # 
    # Then implements Notes tab according to plan
    ```
  </examples>
</instructions>