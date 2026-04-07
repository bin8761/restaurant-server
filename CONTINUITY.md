Goal (incl. success criteria):
- Deploy du an restaurant-server len TOSE (https://tose.sh) theo docs chinh thuc, chay duoc BE full + Fe-Admin.

Constraints/Assumptions:
- Apply all rules under C:\Users\yasuo\Desktop\restaurant-server\rule.
- Update the ledger every turn; replies begin with Ledger Snapshot (Goal + Now/Next + Open Questions).
- Apply continuity-ledger-rule.mdc for every request.
- Work only within C:\Users\yasuo\Desktop\restaurant-server.
- Replies are in Vietnamese.
- Do not run DB or migration or server commands autonomously; ask the user to run.
- Do not run Prisma CLI; the user will run all Prisma CLI commands.

Key decisions:
- TOSE docs da duoc doc lai (overview + CLI + API): project mo ta theo mo hinh 1 app/1 port.
- Chot huong deploy: 1 project = 1 container.
- Chot pham vi: deploy du 10 project (gateway + 8 services + Fe-Admin).
- Da sua FE login de tach loi /users/login va /users/me, them log ro rang.
- Da sua api-gateway local CORS de tranh duplicate Access-Control-Allow-Origin.
- User dong y bat dau pilot order-service cho Dockerfile + deploy config.
- User quyet dinh chuyen huong pilot tu TOSE sang Railway (DB + 1 service).

State:
  - Done:
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
  - Now:
    - Cho user commit/push va deploy Fe-Admin tren Railway (cum C), tro ve gateway cum C.
  - Next:
    - User set env cho Fe-Admin (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GATEWAY_URL`, ws service URLs) va test login.
    - Neu OK, chot checklist kiem thu lien cum A/B/C.

Open questions (UNCONFIRMED if needed):
- Chua chot Dockerfile strategy cho toan bo service sau pilot (template thu cong hay tose generate + chuan hoa).

Working set (files/ids/commands):
- CONTINUITY.md
- api-gateway/src/main/resources/application-local.yml
- Fe-Admin/app/login/page.tsx
- docs.tose.sh (overview/cli/api)
