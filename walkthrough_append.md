
# Fix Agenda Sorting and Badges

I have corrected a critical issue where manually added events and cross-day events were not sorting correctly or displaying the proper date context.

## Issues Identified
1.  **Timezone Shift**: Auto-generated events sometimes shifted dates to the previous day due to timezone differences, causing them to appear out of order.
2.  **Data Corruption**: Manually added events often defaulted to `00:00` because of a fallback mechanism in the saving logic, losing their intended time.
3.  **Missing Badges**: Due to the above data issues, next-day events appeared as same-day events (00:00) and failed to trigger the "Day +1" badge.

## Fixes Implemented
1.  **Robust Date Construction**: Switched to constructing local ISO strings (`YYYY-MM-DD`) manually to avoid UTC shifting.
2.  **Simplified Logic**: Refactored `getTimestamp` and `getDayBadge` to use a consistent, robust date parser (`parseEventDate`).
3.  **Data Integrity**: Removed the `|| '00:00'` fallback in `saveSchedule`, ensuring that the actual input time is preserved.

## Verification
-   **Sorting**: Events are now sorted by their absolute timestamp, correctly interleaving manual and auto-generated items.
-   **Badges**: "Day +1" and "Prev Day" badges now appear correctly based on the day difference.

![Agenda Fix Verification](/Users/darynazvoleiko/.gemini/antigravity/brain/b1cb1768-09c9-4678-bc81-76e4496c0710/verify_sorting_fix_1771345740729.webp)
*(Note: The recording shows the debugging process where the '00:00' data corruption issue was identified and subsequently fixed.)*
