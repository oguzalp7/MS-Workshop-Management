# Metrics Dashboard Update Plan
Exact locations : "src/app/admin/page.tsx" & "src/app/api/admin/dashboard/stats"

## Plan :
1) Move the notification container from this page to workshop page, specifically to the workshop details/profile page, as a new tab. We need to isolate the notifications sent to a specific workshop from the rest. Like, when we select a workshop, we should only able to send notifications to the attendees of that workshop, and only that workshop.
2) The same logic applies to the metrics. When we select a workshop, we should only able to see the metrics of that workshop, and only that workshop. On the workshop details page, we should have a metrics tab that shows the metrics of that workshop.
3) We can keep the global metrics on the admin dashboard page.
