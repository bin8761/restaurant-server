Goal (incl. success criteria):
- Deploy du an restaurant-server len TOSE (https://tose.sh) theo docs chinh thuc, chay duoc BE full + Fe-Admin.
- Tich hop thanh toan SePay vao he thong theo tai lieu mau `package-sepay-integration-reference`.

Constraints/Assumptions:
- Apply all rules under C:\Users\yasuo\Desktop\restaurant-server\rule.
- Update the ledger every turn; replies begin with Ledger Snapshot (Goal + Now/Next + Open Questions).
- Apply continuity-ledger-rule.mdc for every request.
- Work only within C:\Users\yasuo\Desktop\restaurant-server.
- Replies are in Vietnamese.
- Do not run DB or migration or server commands autonomously; ask the user to run.
- Do not run Prisma CLI; the user will run all Prisma CLI commands.

Key decisions:
- User yeu cau doc `rule/continuity-ledger-rule.mdc` va bat buoc ap dung cho moi request ke tu 2026-04-08.
- Ap dung skill brainstorming truoc khi vao implementation cho yeu cau tich hop SePay.
- User chot scope muc 3: tich hop SePay full backend + UI khach (`table-service`) + admin theo doi/doi soat.
- Chot muc doi soat admin SePay = muc 2 (theo doi + thao tac danh dau da xu ly hoan tien thu cong cho case webhook muon).
- Chot rule van hanh: SePay chay song song voi cash (khong thay the cash flow hien tai).
- Chon Approach A: mo rong `payment-service` theo provider-based (`cash` + `sepay`), khong tao microservice moi.
- TOSE docs da duoc doc lai (overview + CLI + API): project mo ta theo mo hinh 1 app/1 port.
- Chot huong deploy: 1 project = 1 container.
- Chot pham vi: deploy du 10 project (gateway + 8 services + Fe-Admin).
- Da sua FE login de tach loi /users/login va /users/me, them log ro rang.
- Da sua api-gateway local CORS de tranh duplicate Access-Control-Allow-Origin.
- User dong y bat dau pilot order-service cho Dockerfile + deploy config.
- User quyet dinh chuyen huong pilot tu TOSE sang Railway (DB + 1 service).

State:
  - Done:
    - Da doc file `rule/continuity-ledger-rule.mdc` va dong bo vao quy trinh lam viec moi turn.
    - Xac nhan backend/gateway login OK bang PowerShell (goi truc tiep 3005 va qua 3000).
    - Khoanh vung loi browser la CORS duplicate header va da patch gateway local.
    - Chot huong deploy TOSE tach BE va FE, moi project 1 container.
    - Pilot order-service: da chuyen application.yml sang env fallback (DB + service URLs) de local/cloud dung chung.
    - Pilot order-service: da them `order-service/Dockerfile` va `order-service/.dockerignore`.
    - Build verify thanh cong cho pilot: `..\\.maven\\apache-maven-3.9.6\\bin\\mvn.cmd -q -DskipTests package` trong `order-service`.
    - User da cai TOSE CLI va login thanh cong.
    - User gap loi TOSE CLI khi tao DB: `db_type is required` du da chon MySQL trong prompt.
    - User tao DB tren web TOSE va nhan loi: `Provisioning failed. Delete and recreate the database.`
    - User da tao MySQL tren Railway thanh cong va da set 4 bien env cho service order-service.
    - User-service register da goi thanh cong sau khi dung password dung policy.
    - Order-service va user-service da tao schema trong Railway MySQL (`orderdb`, `userdb`).
    - Da sua inventory-service: them `spring-boot-maven-plugin` trong `inventory-service/pom.xml` de tao executable jar.
    - Da sua inventory-service datasource sang env fallback trong `inventory-service/src/main/resources/application.yml`.
    - Da them `inventory-service/Dockerfile` va `inventory-service/.dockerignore`.
    - Build verify thanh cong inventory-service bang portable Maven.
    - Da sua menu-service datasource sang env fallback trong `menu-service/src/main/resources/application.yml`.
    - Da sua menu-service inventory URL sang env fallback (`INVENTORY_SERVICE_URL`).
    - Da them `menu-service/Dockerfile` va `menu-service/.dockerignore`.
    - Build verify thanh cong menu-service bang portable Maven.
    - Da sua kitchen-service datasource sang env fallback trong `kitchen-service/src/main/resources/application.yml`.
    - Da bo sung env service URLs cho kitchen-service (`ORDER_SERVICE_URL`, `MENU_SERVICE_URL`, `INVENTORY_SERVICE_URL`).
    - Da them `spring-boot-maven-plugin` trong `kitchen-service/pom.xml` de tao executable jar.
    - Da them `kitchen-service/Dockerfile` va `kitchen-service/.dockerignore`.
    - Build verify thanh cong kitchen-service bang portable Maven.
    - Da sua payment-service datasource sang env fallback trong `payment-service/src/main/resources/application.yml`.
    - Da sua payment-service order URL sang env fallback (`ORDER_SERVICE_URL`).
    - Da them `spring-boot-maven-plugin` trong `payment-service/pom.xml` de tao executable jar.
    - Da them `payment-service/Dockerfile` va `payment-service/.dockerignore`.
    - Build verify thanh cong payment-service bang portable Maven.
    - Da sua table-service datasource sang env fallback trong `table-service/src/main/resources/application.yml`.
    - Da them `table-service/Dockerfile` va `table-service/.dockerignore`.
    - Build verify thanh cong table-service bang portable Maven.
    - Da sua image-service upload dir sang env fallback trong `image-service/src/main/resources/application.yml`.
    - Da them `spring-boot-maven-plugin` trong `image-service/pom.xml` de tao executable jar.
    - Da them `image-service/Dockerfile` va `image-service/.dockerignore`.
    - Build verify thanh cong image-service bang portable Maven.
    - Da sua api-gateway route URIs sang env fallback trong `api-gateway/src/main/resources/application.yml`.
    - Da sua api-gateway CORS allowed origins sang env fallback (`CORS_ALLOWED_ORIGIN_1..3`).
    - Da them `api-gateway/Dockerfile` va `api-gateway/.dockerignore`.
    - Build verify thanh cong api-gateway bang portable Maven.
    - Da sua Fe-Admin rewrite image proxy sang env `NEXT_PUBLIC_GATEWAY_URL` trong `Fe-Admin/next.config.mjs`.
    - Da them `Fe-Admin/Dockerfile` va `Fe-Admin/.dockerignore` de deploy Railway.
    - Da cai deps cho Fe-Admin (`npm ci`) va build verify thanh cong (`npm run build`).
    - Da phan tich loi login Railway `Failed to fetch`: request dang goi sai URL co `:3000` (`https://...railway.app:3000/api/users/login`), kha nang cao la loi network endpoint (khong phai sai credential).
    - Da xac dinh user dang gap loi tren customer frontend (`table-service`), khong phai Fe-Admin; domain trong anh la `restaurant-server-production-3f43...`.
    - Da sua `table-service/src/main/resources/static/js/config.js` de bo localStorage override tren production va sanitize URL runtime neu bi dinh `:3000`.
    - Da sua `table-service/src/main/resources/static/js/app.js` de uu tien `window.API_BASE` thay vi hardcode `host.replace(':3011', ':3000')`.
    - Da sua `table-service/src/main/resources/static/menu/index.html` de dung `window.API_BASE` cho image URL, bo hardcode `hostname + ':3000'`.
    - Da commit va push len `origin/main` commit `0bc3ec6` de trigger Railway build lai cho fix table-service.
    - User da approve toan bo design sections: Architecture, Data Flow, Error Handling, Testing cho SePay.
    - Da tao design doc `docs/plans/2026-04-08-sepay-integration-design.md` va commit `141b3f0`.
    - Da dung skill `writing-plans` va tao implementation plan `docs/plans/2026-04-08-sepay-integration-implementation-plan.md`.
  - Now:
    - Chuan bi commit implementation plan va ban giao lua chon cach thuc thi cho user.
  - Next:
    - User chon cach thuc thi plan (Subagent-Driven trong session nay hoac Parallel Session tach rieng).
    - Neu user chon, bat dau implement theo task-by-task.

Open questions (UNCONFIRMED if needed):
- Chua chot Dockerfile strategy cho toan bo service sau pilot (template thu cong hay tose generate + chuan hoa).
- UNCONFIRMED: Co yeu cau auto-refund qua API provider hay chi danh dau refund thu cong tren admin.

Working set (files/ids/commands):
- CONTINUITY.md
- docs/plans/2026-04-08-sepay-integration-design.md
- docs/plans/2026-04-08-sepay-integration-implementation-plan.md
- api-gateway/src/main/resources/application-local.yml
- Fe-Admin/app/login/page.tsx
- docs.tose.sh (overview/cli/api)
