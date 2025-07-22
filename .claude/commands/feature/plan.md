# Plan Feature Command

<instructions>
  <context>
    Create detailed implementation plans based on investigation findings for character sheet enhancements. Plans focus on WHAT to implement, not HOW to code it. Requires explicit user approval before proceeding to implementation.
  </context>
  
  <requirements>
    - Completed investigation for the issue
    - Understanding of sheet structure and integration points
    - User available for feedback and approval
  </requirements>
  
  <execution>
    1. **Plan Creation**
       - Load investigation from `.claude/investigation/issue-{number}.md`
       - Review sheet modification requirements
       - Define user interaction flow
       - Identify lib-wrapper hook points
       - Document data storage approach
       - List UI/UX considerations
       - Define testing scenarios
    
    2. **Plan Documentation**
       - Save to `.claude/plan/issue-{number}.md`
       - Include sheet selectors and tab locations (no code)
       - Focus on integration approach
       - Document data persistence strategy
       - Add questions for user clarification
    
    3. **User Approval Loop**
       - Present plan with "Does this plan look correct?"
       - Iterate based on feedback
       - Update plan document with changes
       - Only proceed with explicit approval
  </execution>
  
  <validation>
    - [ ] User experience clearly defined
    - [ ] Sheet integration approach documented
    - [ ] Data persistence strategy outlined
    - [ ] UI/UX patterns identified
    - [ ] User explicitly approved plan
  </validation>
  
  <examples>
    ```bash
    # Usage
    /feature:plan issue=1
    
    # Creates plan at .claude/plan/issue-1.md:
    # - Hook: renderActorSheet5eCharacter via lib-wrapper
    # - Tab location: After Biography tab
    # - State storage: sheet._tabs array
    # - UI: Match existing tab styling
    # 
    # Asks: "Does this plan look correct to you?"
    # Waits for approval before proceeding
    ```
  </examples>
</instructions>