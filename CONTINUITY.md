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
  - Now:
    - User yeu cau chuan hoa `server.port` cho cac service con lai de nhan bien `PORT` tren Railway.
  - Next:
    - Sua dong loat `server.port` trong application.yml cua cac service chua doi.
    - Huong dan user push/redeploy sau khi sua.

Open questions (UNCONFIRMED if needed):
- Chua chot Dockerfile strategy cho toan bo service sau pilot (template thu cong hay tose generate + chuan hoa).

Working set (files/ids/commands):
- CONTINUITY.md
- api-gateway/src/main/resources/application-local.yml
- Fe-Admin/app/login/page.tsx
- docs.tose.sh (overview/cli/api)
