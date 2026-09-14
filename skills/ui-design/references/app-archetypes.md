# App archetypes: structural references, not templates

Use this file to choose structure before components. Do not load every archetype into working context. Pick the one closest to the product, plus at most one adjacent archetype for contrast.

Each archetype lists the dominant object, the primary loop, useful component families, and the slop trap to avoid. These are compositional references, not layouts to copy.

## 1. Operations dashboard

**Dominant object:** live system state.
**Loop:** scan -> detect exception -> inspect -> intervene.
**Useful components:** dense data table, status summary, filters, timeline, command/action menu, alert queue, sparklines, split view.
**Avoid:** twelve KPI cards before the actual work queue; decorative charts with no decision attached.

## 2. CRM / sales workspace

**Dominant object:** account/deal/person.
**Loop:** find -> inspect context -> record interaction -> advance state.
**Useful components:** pipeline board, activity feed, contact header, notes composer, task list, stage selector, compact metadata rows, command palette.
**Avoid:** treating every property as its own card; hiding the activity chronology under analytics.

## 3. Admin / back office

**Dominant object:** managed record.
**Loop:** search -> inspect -> change -> verify.
**Useful components:** table, bulk actions, filters, detail drawer/page, audit log, confirmation dialog, import/export progress.
**Avoid:** consumer-style giant cards; icon-only destructive actions; dashboarding before CRUD is excellent.

## 4. Finance / payments

**Dominant object:** transaction/account/balance.
**Loop:** verify identity/context -> inspect amount/status -> act -> reconcile.
**Useful components:** ledger table, amount hierarchy, status timeline, receipt, reconciliation view, explicit confirmation, immutable audit details.
**Avoid:** playful motion around money; ambiguous color-only status; hiding fees or settlement state.

## 5. Healthcare / clinical

**Dominant object:** patient/encounter/order.
**Loop:** orient -> review evidence -> decide -> document.
**Useful components:** patient banner, problem list, vitals/lab trends, medication list, timeline, order composer, alerts with severity and rationale.
**Avoid:** dashboard-card soup; low-density whitespace that forces excessive scrolling; decorative risk colors without clinical meaning.

## 6. Logistics / fleet / dispatch

**Dominant object:** moving asset/job.
**Loop:** locate -> assess delay/exception -> assign/reroute -> monitor.
**Useful components:** map + list split view, route timeline, ETA/status chips, assignment drawer, exception queue, geofence/event history.
**Avoid:** full-screen map with controls floating randomly; every vehicle rendered with equal visual priority.

## 7. Security / access control

**Dominant object:** identity/event/permission.
**Loop:** authenticate -> evaluate -> permit/deny -> audit.
**Useful components:** event stream, identity detail, permission matrix, checkpoint action surface, incident queue, immutable audit trail, badge/card lifecycle controls.
**Avoid:** green/red alone as meaning; buried denial reason; flashy cyberpunk styling that reduces operational readability.

## 8. Developer / infrastructure tool

**Dominant object:** service/build/deployment/resource.
**Loop:** inspect state -> change config/code -> run -> observe result.
**Useful components:** tree/sidebar, command palette, logs, diff, terminal/code block, status timeline, metrics, environment selector.
**Avoid:** fake terminal aesthetics when the product is not terminal-like; splitting one workflow across endless cards.

## 9. Analytics / BI

**Dominant object:** question/metric/segment.
**Loop:** choose scope -> compare -> drill -> explain.
**Useful components:** query/filter bar, chart + table pair, breakdown controls, annotations, metric definition tooltip, saved views.
**Avoid:** chart gallery syndrome; unlabeled percentages; six colors where two categories exist.

## 10. Project / task management

**Dominant object:** work item/project.
**Loop:** capture -> prioritize -> execute -> update -> review.
**Useful components:** list/board/calendar views, quick add, assignee/status controls, detail pane, comments/activity, dependency indicators.
**Avoid:** copying Linear/Notion/Jira surface styling without matching the user's workflow; excessive status pills.

## 11. Content / CMS / publishing

**Dominant object:** document/content entry.
**Loop:** draft -> edit -> preview -> review -> publish.
**Useful components:** editor, outline, metadata inspector, preview, revision history, scheduled state, asset picker.
**Avoid:** burying the content canvas inside nested panels; making publishing state look like a generic form field.

## 12. E-commerce / marketplace

**Dominant object:** product/offer/cart.
**Loop:** discover -> evaluate -> choose variant -> commit.
**Useful components:** search, filters, product media, price/availability block, variant selector, comparison, cart sheet/page, order timeline.
**Avoid:** feature-card marketing inside the shopping flow; hiding total cost until the last step.

## 13. Social / community

**Dominant object:** post/person/conversation.
**Loop:** discover -> consume -> respond/share -> return.
**Useful components:** feed, composer, thread, profile header, lightweight reaction controls, notification inbox, moderation/reporting surfaces.
**Avoid:** all engagement actions visually equal; infinite noisy badges; treating every post type as the same card.

## 14. Messaging / support

**Dominant object:** conversation/ticket.
**Loop:** triage -> read context -> reply/act -> resolve.
**Useful components:** conversation list, message timeline, composer, customer/context panel, macros, assignment/status controls, SLA cues.
**Avoid:** huge header chrome consuming vertical space; burying context in modal dialogs; chatbot bubbles for non-chat workflows.

## 15. Field / mobile workforce

**Dominant object:** assigned job/checklist/location.
**Loop:** receive -> travel -> perform -> capture proof -> sync.
**Useful components:** today queue, map/directions handoff, checklist, camera/file capture, signature, offline status, sync queue, large primary actions.
**Avoid:** desktop admin controls on the worker app; network-required completion; tiny secondary actions used in bright/outdoor conditions.

## Component-selection rule

Choose components by the action and information shape, not by visual novelty.

- repeated comparable records -> table/list
- spatial relationship -> map/canvas
- chronological evidence -> timeline/feed
- mutually exclusive small choice -> segmented control/radio
- many optional filters -> filter sheet/popover/sidebar depending viewport
- record inspection while preserving list context -> split view/drawer on large screens, full screen on phone
- destructive/irreversible action -> explicit confirmation with object + consequence
- one dominant repeated action -> visible action near the working area, not hidden in a kebab menu

A component library is a parts bin. The archetype decides what deserves to exist in the first place.
