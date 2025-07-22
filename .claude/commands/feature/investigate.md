# Investigate Feature Command

<instructions>
  <context>
    Collaborative investigation of GitHub issues for FoundryVTT character sheet enhancements. Combines autonomous codebase analysis with targeted runtime exploration to understand requirements and existing sheet implementation.
  </context>
  
  <requirements>
    - GitHub issue number provided
    - FoundryVTT running locally with D&D 5e system
    - User available for runtime inspection
    - Browser console accessible
    - Character sheet open for testing
  </requirements>
  
  <execution>
    1. **Autonomous Investigation**
       - Fetch issue: `gh issue view {number} -R nivthefox/foundryvtt-dnd5e-sheet-notes`
       - Search D&D 5e system for sheet implementation
       - Identify tab system and sheet rendering patterns
       - Review how sheets handle data and state
       - Document initial findings
    
    2. **Collaborative Runtime Investigation**
       - Request sheet-specific console commands
       - Ask user to interact with character sheets
       - Test tab switching and state persistence
       - Examine sheet re-render behavior
       - Document all findings in `.claude/investigation/issue-{number}.md`
    
    3. **Investigation Synthesis**
       - Combine codebase findings with runtime data
       - Identify lib-wrapper integration points
       - Note sheet modification approach
       - Prepare for planning phase
  </execution>
  
  <validation>
    - [ ] Issue requirements fully understood
    - [ ] Sheet structure and patterns identified
    - [ ] Runtime behavior documented
    - [ ] Integration points determined
    - [ ] Investigation notes saved
  </validation>
  
  <examples>
    ```bash
    # Basic usage
    /feature:investigate issue=1
    
    # Investigation flow:
    # 1. Reads issue #1 about adding Notes tab
    # 2. Searches for ActorSheet5e implementation
    # 3. Asks user to run console commands:
    #    - ui.activeWindow.constructor.name
    #    - ui.activeWindow._tabs
    # 4. Documents findings in .claude/investigation/issue-1.md
    ```
  </examples>
</instructions>