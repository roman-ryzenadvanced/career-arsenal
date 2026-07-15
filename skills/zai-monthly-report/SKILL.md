# Z.ai Monthly Community Report Skill

Author: Roman (rommark.dev) | For: Agnes / Z.AI Management | Compensation Reports

## Purpose

Generate Roman's monthly community operation report for Z.AI management compensation review. The report covers community management achievements, brand promotion, developer ecosystem contributions, and next month's plan.

## Output Format

Default: **Excel (.xlsx)** with structured sheets. Alternative: **Word (.docx)** if user requests.

## Report Structure (Excel Sheets)

### Sheet 1: Summary & Human Paragraph

A brief executive summary paragraph describing Roman's contributions in natural human language, followed by key highlights.

### Sheet 2: Community Operation Achievements

| Item | Details | Proof/Screenshot |
|------|---------|------------------|
| Managed community channels | List channels (Discord, Telegram, etc.) | Screenshot links |
| Activity status | Active days, response rate, threads handled | Data |
| User interaction situation | Messages responded, questions answered, issues triaged | Data |
| Daily operation support | Support tickets handled, avg response time | Data |

### Sheet 3: Brand Promotion Results

| Item | Details | Proof/Screenshot |
|------|---------|------------------|
| Content release situation | Articles, posts, tutorials published (with links) | Links |
| Community exposure data | Reach, views, impressions, engagement metrics | Data |
| Developer feedback & impact scope | Feedback collected, bugs reported, features suggested, impact radius | Links/data |

### Sheet 4: Project Value & Contributions

| Item | Details |
|------|---------|
| Main work completed this month | Bullet list of key accomplishments |
| Contribution to Z.ai developer ecosystem | How work helped developers adopt/use/improve Z.ai |
| GitHub issues submitted | Links to issues filed at github.com/zai-org/feedback |
| Summary of project value | Brief value assessment |

### Sheet 5: Next Month's Plan

| Priority | Planned Action | Expected Outcome |
|----------|---------------|------------------|
| High | ... | ... |
| Medium | ... | ... |
| Low | ... | ... |

## Data Sources

To generate accurate reports, collect/verify:

1. **Discord activity**: Use VectorDB queries or Discord data exports
2. **GitHub issues**: Query `github.com/zai-org/feedback/issues` with author `roman-ryzenadvanced`
3. **Articles/content**: Links and publication dates from Roman
4. **Screenshots**: User provides; mark as `[Screenshot needed]` if missing
5. **Telegram channel stats**: From `t.me/VibeCodePrompterSystem`

## GitHub Integration

Roman's GitHub profile: **roman-ryzenadvanced**
Issue tracker: **https://github.com/zai-org/feedback/issues**

To fetch Roman's submitted issues:
```bash
gh api "repos/zai-org/feedback/issues?state=all&creator=roman-ryzenadvanced&per_page=100" --jq '.[] | "- #" + (.number|tostring) + " " + .title + " (" + .state + ", " + .created_at[:10] + ")"'
```

## Signature

All reports and GitHub issues signed with:

```
Regards,
Roman
- http://www.rommark.dev
- Vibe Coders Telegram Channel: https://t.me/VibeCodePrompterSystem
```

## Rules

1. If a data item is not available or not applicable, mark it as **N/A** — do not fabricate data
2. Always include the human paragraph on Sheet 1
3. Always list GitHub issues submitted that month with links
4. Use concrete numbers where possible; use ranges/estimates only when marked as approximate
5. Screenshots are proof — always have a column for them, even if empty (mark `[Pending]`)
6. The report language should be **professional English** unless Roman requests otherwise
7. Excel output should have clean formatting: headers bold, alternating row colors, auto-width columns
8. Include report month/year in the filename: `ZAI_Monthly_Report_YYYY_MM.xlsx`

## Usage

When Roman asks for a monthly report, invoke this skill and:
1. Ask Roman for the report month and any specific data he wants to highlight
2. Fetch his GitHub issues for that month
3. Generate the Excel with all 5 sheets
4. Save to `/home/z/my-project/download/`