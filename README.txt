* {
  box-sizing: border-box;
}

:root {
  color: #14324a;
  background: #eaf7ff;
  font-family: Inter, "Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.5;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.9), transparent 28rem),
    linear-gradient(180deg, #f7fcff 0%, #e7f5ff 100%);
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  border: 0;
}

.app-shell {
  min-height: 100vh;
  padding-bottom: 86px;
}

.phone-frame {
  width: min(100%, 520px);
  margin: 0 auto;
}

.page-back-row {
  padding: 12px 16px 0;
}

.page-back-button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 13px 0 11px;
  color: #176f9f;
  border: 1px solid #c7e7f7;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 7px 18px rgba(31, 119, 164, 0.1);
  font-weight: 900;
  cursor: pointer;
}

.page-back-button:active {
  background: #e7f6ff;
}

.screen {
  min-height: calc(100vh - 86px);
  padding: 20px 16px 24px;
}

.sync-notice {
  margin: 12px 16px -4px;
  padding: 10px 12px;
  color: #8a5a10;
  border: 1px solid #ffe1a6;
  border-radius: 14px;
  background: #fff7df;
  font-size: 0.82rem;
  font-weight: 800;
}

.page-header {
  display: grid;
  gap: 7px;
  margin-bottom: 18px;
}

.brand-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  color: #0874b9;
  background: #dff3ff;
  box-shadow: inset 0 0 0 1px #b9e4fb;
}

.page-header p {
  margin: 0;
  color: #3e8ec0;
  font-size: 0.84rem;
  font-weight: 800;
}

.page-header h1 {
  margin: 0;
  color: #12344d;
  font-size: clamp(1.65rem, 8vw, 2.35rem);
  line-height: 1.12;
  letter-spacing: 0;
}

.page-header span {
  color: #5d7488;
  font-size: 0.95rem;
}

.hero-card,
.quiz-card,
.answer-card,
.form-card,
.comment-box,
.comment-card,
.profile-card,
.stat-card,
.revenue-card,
.empty-card {
  border: 1px solid #cdeafa;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 42px rgba(27, 107, 155, 0.11);
}

.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  color: #0c5b92;
  background: linear-gradient(135deg, #ffffff 0%, #dff4ff 100%);
}

.hero-card strong,
.hero-card p {
  margin: 0;
}

.hero-card p {
  margin-top: 5px;
  color: #426b84;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

.action-card {
  position: relative;
  min-height: 150px;
  padding: 16px;
  text-align: left;
  color: #12344d;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(23, 109, 158, 0.1);
}

.action-card svg:first-child {
  color: #1689cf;
}

.action-card span,
.action-card small {
  display: block;
}

.action-card span {
  margin-top: 18px;
  font-size: 1.04rem;
  font-weight: 800;
}

.action-card small {
  margin-top: 4px;
  color: #637f91;
}

.action-card svg:last-child {
  position: absolute;
  right: 14px;
  bottom: 14px;
  color: #7bbde4;
}

.quiz-list,
.comment-list {
  display: grid;
  gap: 14px;
}

.subject-filter {
  display: flex;
  gap: 8px;
  margin: -2px -16px 14px;
  padding: 2px 16px 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.subject-filter::-webkit-scrollbar {
  display: none;
}

.subject-filter-button {
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 13px;
  color: #176f9f;
  border: 1px solid #c7e7f7;
  border-radius: 999px;
  background: #ffffff;
  font-weight: 900;
  white-space: nowrap;
  box-shadow: 0 7px 18px rgba(31, 119, 164, 0.08);
}

.subject-filter-button.active {
  color: #ffffff;
  border-color: #1597d5;
  background: linear-gradient(135deg, #1597d5, #35b9e8);
  box-shadow: 0 10px 22px rgba(20, 143, 207, 0.2);
}

.quiz-card {
  padding: 18px;
}

.empty-card {
  padding: 18px;
  color: #24465d;
}

.empty-card p {
  margin-bottom: 0;
  color: #526b7d;
}

.card-top,
.meta-row,
.reaction-row,
.avatar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-top {
  justify-content: space-between;
}

.subject,
.difficulty {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}

.subject {
  color: #0c71ae;
  background: #e1f4ff;
}

.difficulty {
  color: #2f6f54;
  background: #e3f8ec;
}

.difficulty.難しい {
  color: #8a5a10;
  background: #fff1cf;
}

.quiz-card h2 {
  margin: 12px 0 6px;
  font-size: 1.12rem;
}

.quiz-card p,
.comment-card p,
.profile-card p,
.revenue-card p {
  color: #526b7d;
}

.meta-row {
  margin: 14px 0;
  color: #6a8192;
  font-size: 0.82rem;
}

.primary-button,
.secondary-button {
  width: 100%;
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 16px;
  font-weight: 900;
}

.primary-button {
  color: #ffffff;
  background: linear-gradient(135deg, #1597d5, #35b9e8);
  box-shadow: 0 12px 22px rgba(20, 143, 207, 0.22);
}

.primary-button:disabled {
  color: #7f9caf;
  background: #d8ecf7;
  box-shadow: none;
}

.secondary-button {
  color: #1478b7;
  background: #e5f5ff;
}

.notice {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 14px;
  color: #136c9f;
  border-radius: 18px;
  background: #e1f7ff;
  font-weight: 800;
}

.answer-card,
.form-card,
.comment-box,
.profile-card {
  padding: 18px;
}

.question-text {
  margin: 0 0 16px;
  color: #18384f;
  font-size: 1.12rem;
  font-weight: 800;
}

.session-progress {
  width: fit-content;
  margin: 0 0 12px;
  padding: 7px 11px;
  color: #1478b7;
  border-radius: 999px;
  background: #e5f5ff;
  font-size: 0.78rem;
  font-weight: 900;
}

.choice-list {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}

.choice-button {
  width: 100%;
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  text-align: left;
  color: #1d3c54;
  border: 2px solid #d3eaf7;
  border-radius: 18px;
  background: #ffffff;
}

.choice-button span {
  width: 32px;
  height: 32px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: #1284c6;
  border-radius: 12px;
  background: #e6f6ff;
  font-weight: 900;
}

.choice-button.selected {
  border-color: #30a9dd;
  background: #eefaff;
}

.choice-button.correct {
  border-color: #66cfa1;
  background: #effcf6;
}

.result-box {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 20px;
}

.result-box.positive {
  color: #12623f;
  background: #eafbf2;
}

.result-box.learning {
  color: #0e6898;
  background: #e6f6ff;
}

.result-box p {
  margin: 0;
}

.complete-message {
  padding: 12px;
  color: #12623f;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  font-weight: 800;
}

.answer-actions {
  display: grid;
  gap: 10px;
}

.explanation {
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.explanation span {
  display: block;
  margin-bottom: 4px;
  font-size: 0.84rem;
  font-weight: 900;
}

.form-card,
.comment-box {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 7px;
  color: #24465d;
  font-weight: 800;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid #c9e5f5;
  border-radius: 15px;
  padding: 13px 14px;
  color: #16354d;
  background: #f8fdff;
  outline: none;
}

textarea {
  resize: vertical;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #2aa7dc;
  box-shadow: 0 0 0 4px rgba(42, 167, 220, 0.14);
}

.subject-select {
  min-height: 52px;
  border-width: 2px;
  background-color: #f7fcff;
  font-weight: 800;
  cursor: pointer;
}

.subject-select:invalid {
  color: #60798b;
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.choice-editor {
  display: grid;
  gap: 9px;
}

.choice-editor > span {
  color: #24465d;
  font-weight: 900;
}

.choice-input {
  grid-template-columns: 24px 1fr;
  align-items: center;
}

.soft-message {
  margin: 0;
  color: #1478b7;
  font-weight: 800;
}

.comment-box {
  margin-bottom: 14px;
}

.comment-card {
  padding: 16px;
}

.avatar,
.big-avatar {
  display: grid;
  place-items: center;
  color: #ffffff;
  background: #38aee0;
  font-weight: 900;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 12px;
}

.reaction-row {
  margin-top: 12px;
}

.reaction-row button {
  min-height: 38px;
  padding: 8px 11px;
  color: #1478b7;
  border-radius: 999px;
  background: #e7f6ff;
  font-size: 0.82rem;
  font-weight: 800;
}

.profile-card {
  text-align: center;
}

.big-avatar {
  width: 78px;
  height: 78px;
  margin: 0 auto 10px;
  border-radius: 28px;
  font-size: 1.6rem;
}

.profile-card h2 {
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 14px;
}

.stat-card {
  min-height: 126px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 6px;
  padding: 12px 8px;
  text-align: center;
}

.stat-card svg {
  color: #148dcc;
}

.stat-card strong {
  color: #12344d;
  font-size: 1.75rem;
}

.stat-card span {
  color: #637f91;
  font-size: 0.78rem;
  font-weight: 800;
}

.revenue-card {
  display: flex;
  gap: 12px;
  margin-top: 14px;
  padding: 16px;
}

.revenue-card svg {
  flex: 0 0 auto;
  color: #1597d5;
}

.revenue-card p {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
}

.onboarding-shell {
  padding-bottom: 0;
}

.role-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.role-grid {
  display: grid;
  gap: 12px;
}

.role-card {
  position: relative;
  min-height: 176px;
  display: grid;
  grid-template-columns: 52px 1fr;
  align-content: center;
  align-items: center;
  gap: 4px 14px;
  padding: 20px;
  text-align: left;
  color: #173b54;
  border: 1px solid #cdeafa;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 15px 38px rgba(27, 107, 155, 0.11);
}

.role-card strong {
  font-size: 1.08rem;
}

.role-card span {
  grid-column: 2;
  padding-right: 22px;
  color: #5d788a;
  font-size: 0.9rem;
}

.role-card > svg {
  position: absolute;
  right: 18px;
  color: #75b9df;
}

.role-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 16px;
}

.role-icon.teacher {
  color: #0874b9;
  background: #dff3ff;
}

.role-icon.student {
  color: #28765b;
  background: #e3f8ec;
}

.role-form {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid #cdeafa;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 16px 42px rgba(27, 107, 155, 0.11);
}

.text-button {
  width: fit-content;
  padding: 0;
  color: #2389c2;
  background: transparent;
  font-size: 0.86rem;
  font-weight: 800;
}

.role-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-heading strong,
.role-heading span {
  display: block;
}

.role-heading strong {
  color: #173b54;
  font-size: 1.08rem;
}

.role-heading span {
  margin-top: 2px;
  color: #698294;
  font-size: 0.84rem;
}

.code-panel {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 18px;
  color: #426b84;
  border: 1px dashed #75c4e9;
  border-radius: 18px;
  background: #edf9ff;
}

.code-panel strong,
.class-code-row strong {
  color: #0c6fa8;
  font-size: 1.75rem;
  letter-spacing: 0.14em;
}

.code-panel small {
  text-align: center;
}

.code-input {
  text-align: center;
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.form-error {
  margin: -5px 0 0;
  color: #a34e5a;
  font-size: 0.86rem;
  font-weight: 800;
}

.nickname-note {
  margin: -5px 0 0;
  color: #668094;
  font-size: 0.82rem;
}

.teacher-entry-grid {
  display: grid;
  gap: 10px;
}

.entry-option {
  min-height: 112px;
  display: grid;
  grid-template-columns: 42px 1fr;
  align-content: center;
  align-items: center;
  gap: 3px 11px;
  padding: 15px;
  text-align: left;
  color: #173b54;
  border: 1px solid #cdeafa;
  border-radius: 18px;
  background: #f7fcff;
}

.entry-option > svg {
  grid-row: 1 / span 2;
  color: #148dcc;
}

.entry-option strong,
.entry-option span {
  grid-column: 2;
}

.entry-option span {
  color: #698294;
  font-size: 0.82rem;
}

.class-banner {
  display: grid;
  gap: 12px;
  margin-bottom: 14px;
  padding: 16px;
  color: #173b54;
  border: 1px solid #cdeafa;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(23, 109, 158, 0.09);
}

.class-banner-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.class-banner-top span {
  color: #4f8eb5;
  font-size: 0.78rem;
  font-weight: 900;
}

.class-banner-top h2 {
  margin: 1px 0 0;
  font-size: 1.08rem;
}

.class-banner > p {
  margin: 0;
  color: #607d90;
  font-size: 0.88rem;
}

.class-code-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 15px;
  background: #e9f7ff;
}

.class-code-row span {
  color: #52778d;
  font-size: 0.82rem;
  font-weight: 800;
}

.class-code-row strong {
  font-size: 1.08rem;
}

.class-code-row svg {
  color: #1689cf;
}

.dashboard-link {
  min-height: 44px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 9px;
  padding: 10px 12px;
  text-align: left;
  color: #0874b9;
  border-radius: 14px;
  background: #eef9ff;
  font-size: 0.86rem;
  font-weight: 900;
}

.dashboard-code-card {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 18px;
  color: #ffffff;
  border-radius: 22px;
  background: #137ebc;
  box-shadow: 0 16px 32px rgba(19, 126, 188, 0.22);
}

.dashboard-code-card span,
.dashboard-code-value {
  display: block;
}

.dashboard-code-card span {
  font-size: 0.82rem;
  font-weight: 800;
  opacity: 0.82;
}

.dashboard-code-value {
  width: 190px;
  margin-top: 3px;
  padding: 0;
  color: #ffffff;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  font-size: 1.7rem;
  line-height: 1.25;
  letter-spacing: 0.14em;
  font-weight: 900;
  cursor: text;
}

.dashboard-code-value:focus {
  border: 0;
  box-shadow: none;
  outline: 0;
}

.dashboard-code-value::selection {
  color: #0874b9;
  background: #ffffff;
}

.dashboard-code-card button {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: #0874b9;
  border-radius: 14px;
  background: #ffffff;
}

.dashboard-code-card small {
  position: absolute;
  right: 16px;
  bottom: -24px;
  padding: 5px 9px;
  color: #126b9f;
  border-radius: 9px;
  background: #dff3ff;
  font-weight: 800;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
  margin-top: 14px;
}

.dashboard-stats article {
  min-height: 112px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 5px;
  padding: 10px 6px;
  text-align: center;
  border: 1px solid #cdeafa;
  border-radius: 19px;
  background: #ffffff;
  box-shadow: 0 10px 25px rgba(23, 109, 158, 0.08);
}

.dashboard-stats svg {
  color: #188dca;
}

.dashboard-stats strong {
  color: #173b54;
  font-size: 1.55rem;
}

.dashboard-stats span {
  color: #688194;
  font-size: 0.75rem;
  font-weight: 800;
}

.dashboard-section {
  margin-top: 14px;
  padding: 17px;
  border: 1px solid #cdeafa;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(23, 109, 158, 0.08);
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title-row span {
  color: #4c91ba;
  font-size: 0.72rem;
  font-weight: 900;
}

.section-title-row h2 {
  margin: 1px 0 0;
  color: #173b54;
  font-size: 1.05rem;
}

.section-title-row > strong {
  color: #187eb8;
  font-size: 0.86rem;
}

.section-title-row button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 11px;
  color: #0874b9;
  border-radius: 12px;
  background: #e7f6ff;
  font-size: 0.82rem;
  font-weight: 900;
}

.member-list,
.dashboard-quiz-list {
  display: grid;
  gap: 8px;
}

.member-row,
.dashboard-quiz-list article {
  display: grid;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  background: #f4fbff;
}

.member-row {
  grid-template-columns: auto 1fr auto;
}

.member-row > span {
  color: #418469;
  font-size: 0.75rem;
  font-weight: 900;
}

.dashboard-quiz-list article {
  grid-template-columns: 1fr auto;
}

.dashboard-quiz-list strong,
.dashboard-quiz-list span {
  display: block;
}

.dashboard-quiz-list span,
.dashboard-quiz-list small {
  color: #688194;
  font-size: 0.76rem;
}

.empty-dashboard {
  display: grid;
  justify-items: center;
  gap: 5px;
  padding: 20px 12px;
  text-align: center;
  color: #5f7c90;
  border-radius: 15px;
  background: #f2faff;
}

.empty-dashboard p {
  margin: 0;
  font-size: 0.82rem;
}

.role-badge {
  display: inline-block;
  margin-top: 7px;
  padding: 4px 10px;
  color: #0874b9;
  border-radius: 999px;
  background: #e1f4ff;
  font-size: 0.78rem;
  font-weight: 900;
}

.role-reset-button {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  color: #52778d;
  border: 1px solid #cde5f2;
  border-radius: 16px;
  background: #ffffff;
  font-weight: 800;
}

.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: 12px;
  z-index: 10;
  width: min(calc(100% - 24px), 500px);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 8px;
  border: 1px solid #cce8f8;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 42px rgba(18, 98, 145, 0.2);
  transform: translateX(-50%);
  backdrop-filter: blur(12px);
}

.bottom-nav button {
  min-height: 58px;
  display: grid;
  place-items: center;
  gap: 3px;
  color: #668397;
  border-radius: 18px;
  background: transparent;
  font-size: 0.72rem;
  font-weight: 900;
}

.bottom-nav button.active {
  color: #0874b9;
  background: #e2f4ff;
}

@media (min-width: 680px) {
  .screen {
    padding-top: 28px;
  }
}

@media (max-width: 380px) {
  .action-grid,
  .two-columns,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .role-card {
    min-height: 164px;
  }

  .dashboard-stats {
    gap: 6px;
  }

  .bottom-nav span {
    font-size: 0.68rem;
  }
}
