### Authorization Update

At this moment, we have a single type of admin users. We need to create a hierarchical authorization system for admins. Full authority is given to the current admin users. However, we might want to create a new type of authority called "manager" which has less authority than the current admins.

#### What can managers able to do?
- Push workshop based global notifications, isolated from other workshops
- Able to change the status of orders as it is.
- Able to check in guests manually
- Able to register guests manually
- Register workshop stocks manually

#### What managers can not do?
- They shouldn't be able to see the most global dashboard, located in "/admin/page.tsx"
- They shouldn't be able to delete a workshop
- They shouldn't be able to add a new workshop
- They shouldn't be able to edit a workshop
- Can not add/modify/delete price tiers
