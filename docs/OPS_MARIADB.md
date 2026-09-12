# MariaDB — journal des pannes et des remises en route

> Genere par `ops-mariadb-recover.yml`. Ne pas modifier a la main.
> Chaque execution ajoute une entree : c est la suite qui montre le motif.

---

## Execution du 2026-08-31 18:39 UTC

Declencheur : `push` — par `Wealthtechinnovations`

```
==============================================
 1. ETAT AVANT INTERVENTION
==============================================
Service detecte : mariadb
● mariadb.service - MariaDB 10.6.23 database server
     Loaded: loaded (/lib/systemd/system/mariadb.service; enabled; vendor preset: enabled)
     Active: active (running) since Mon 2026-08-31 18:34:23 UTC; 5min ago
       Docs: man:mariadbd(8)
             https://mariadb.com/kb/en/library/systemd/
    Process: 682903 ExecStartPre=/usr/bin/install -m 755 -o mysql -g root -d /var/run/mysqld (code=exited, status=0/SUCCESS)
    Process: 682904 ExecStartPre=/bin/sh -c systemctl unset-environment _WSREP_START_POSITION (code=exited, status=0/SUCCESS)
    Process: 682906 ExecStartPre=/bin/sh -c [ ! -e /usr/bin/galera_recovery ] && VAR= ||   VAR=`/usr/bin/galera_recovery`; [ $? -eq 0 ]   && systemctl set-environment _WSREP_START_POSITION=$VAR || exit 1 (code=exited, status=0/SUCCESS)
    Process: 682956 ExecStartPost=/bin/sh -c systemctl unset-environment _WSREP_START_POSITION (code=exited, status=0/SUCCESS)
    Process: 682958 ExecStartPost=/etc/mysql/debian-start (code=exited, status=0/SUCCESS)
   Main PID: 682944 (mariadbd)
     Status: "Taking your SQL requests now..."
      Tasks: 33 (limit: 141204)
     Memory: 394.1M
        CPU: 1min 26.538s
     CGroup: /system.slice/mariadb.service
             └─682944 /usr/sbin/mariadbd

Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Buffer pool(s) load completed at 260831 18:34:23
Aug 31 18:34:23 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682960]: Upgrading MySQL tables if necessary.
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682964]: Looking for 'mariadb' as: /usr/bin/mariadb
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682964]: Looking for 'mariadb-check' as: /usr/bin/mariadb-check
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682964]: This installation of MariaDB is already upgraded to 10.6.7-MariaDB.
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682964]: There is no need to run mysql_upgrade again for 10.6.23-MariaDB, because they're both 10.6.

Socket attendu par le client :
srwxrwxrwx 1 mysql mysql 0 Aug 31 18:34 /run/mysqld/mysqld.sock

==============================================
 2. POURQUOI IL S EST ARRETE
==============================================
--- journal du service (30 dernieres lignes) ---
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] Starting MariaDB 10.6.23-MariaDB-0ubuntu0.22.04.1 source revision fe8047caf26d20e98ea7f6ec1dce3924e696703f server_uid DgYuMhVV0ZqiHtl/8Vb/d9FBcP8= as process 682944
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Compressed tables use zlib 1.2.11
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Number of pools: 1
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Using crc32 + pclmulqdq instructions
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Using liburing
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Initializing buffer pool, total size = 134217728, chunk size = 134217728
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Completed initialization of buffer pool
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Starting crash recovery from checkpoint LSN=52165046453,52165046453
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: 128 rollback segments are active.
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Removed temporary tablespace data file: "./ibtmp1"
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Creating shared tablespace for temporary tables
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Setting file './ibtmp1' size to 12 MB. Physically writing the file full; Please wait ...
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: File './ibtmp1' size is now 12 MB.
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: 10.6.23 started; log sequence number 52165046465; transaction id 19937284
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Loading buffer pool(s) from /var/lib/mysql/ib_buffer_pool
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] Plugin 'FEEDBACK' is disabled.
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Warning] You need to use --log-bin to make --expire-logs-days or --binlog-expire-logs-seconds work.
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] Server socket created on IP: '127.0.0.1'.
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] /usr/sbin/mariadbd: ready for connections.
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: Version: '10.6.23-MariaDB-0ubuntu0.22.04.1'  socket: '/run/mysqld/mysqld.sock'  port: 3306  Ubuntu 22.04
Aug 31 18:34:23 priceless-mayer mariadbd[682944]: 2026-08-31 18:34:23 0 [Note] InnoDB: Buffer pool(s) load completed at 260831 18:34:23
Aug 31 18:34:23 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682960]: Upgrading MySQL tables if necessary.
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682964]: Looking for 'mariadb' as: /usr/bin/mariadb
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682964]: Looking for 'mariadb-check' as: /usr/bin/mariadb-check
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682964]: This installation of MariaDB is already upgraded to 10.6.7-MariaDB.
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682964]: There is no need to run mysql_upgrade again for 10.6.23-MariaDB, because they're both 10.6.
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682964]: You can use --force if you still want to run mysql_upgrade
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682993]: Checking for insecure root accounts.
Aug 31 18:34:23 priceless-mayer /etc/mysql/debian-start[682999]: Triggering myisam-recover for all MyISAM tables and aria-recover for all Aria tables

--- traces de tuerie memoire (OOM) ---
Aug 31 18:33:01 priceless-mayer kernel: node invoked oom-killer: gfp_mask=0x1100dca(GFP_HIGHUSER_MOVABLE|__GFP_ZERO), order=0, oom_score_adj=0
Aug 31 18:33:01 priceless-mayer kernel: oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=user.slice,mems_allowed=0,global_oom,task_memcg=/system.slice/mariadb.service,task=mariadbd,pid=2593316,uid=113
Aug 31 18:33:01 priceless-mayer kernel: Out of memory: Killed process 2593316 (mariadbd) total-vm:18323632kB, anon-rss:13763268kB, file-rss:40kB, shmem-rss:0kB, UID:113 pgtables:31376kB oom_score_adj:0

--- memoire disponible ---
               total        used        free      shared  buff/cache   available
Mem:           17945        2951       13694         235        1300       14408
Swap:           2047         628        1419

==============================================
 3. REDEMARRAGE
==============================================
Le service est deja actif — aucun redemarrage necessaire.
Etat : active

==============================================
 4. VERIFICATION — la base repond-elle ?
==============================================
srwxrwxrwx 1 mysql mysql 0 Aug 31 18:34 /run/mysqld/mysqld.sock
1258
2026-08-28

--- l API repond-elle de nouveau ? ---
  /api/getfondbypays/MAROC : HTTP 200

==============================================
 FIN
==============================================
```

---

## Execution du 2026-09-11 22:08 UTC

Declencheur : `push` — par `Wealthtechinnovations`

```
==============================================
 1. ETAT AVANT INTERVENTION
==============================================
Service detecte : mariadb
● mariadb.service - MariaDB 10.6.23 database server
     Loaded: loaded (/lib/systemd/system/mariadb.service; enabled; vendor preset: enabled)
     Active: active (running) since Wed 2026-09-09 06:25:03 UTC; 2 days ago
       Docs: man:mariadbd(8)
             https://mariadb.com/kb/en/library/systemd/
   Main PID: 1256690 (mariadbd)
     Status: "Taking your SQL requests now..."
      Tasks: 31 (limit: 141204)
     Memory: 9.0G
        CPU: 1h 18min 36.950s
     CGroup: /system.slice/mariadb.service
             └─1256690 /usr/sbin/mariadbd

Sep 10 14:00:14 priceless-mayer mariadbd[1256690]: 2026-09-10 14:00:14 7774 [Warning] Aborted connection 7774 to db: 'fund_opcvm' user: 'fund_opcvm' host: 'localhost' (Got timeout reading communication packets)
Sep 11 00:00:04 priceless-mayer mariadbd[1256690]: 2026-09-11  0:00:04 23940 [Warning] Aborted connection 23940 to db: 'unconnected' user: 'unauthenticated' host: 'localhost' (This connection closed normally without authentication)
Sep 11 00:00:04 priceless-mayer mariadbd[1256690]: 2026-09-11  0:00:04 23941 [Warning] Aborted connection 23941 to db: 'e_vote_db' user: 'e_vote_user' host: 'localhost' (Got an error reading communication packets)
Sep 11 00:14:07 priceless-mayer mariadbd[1256690]: 2026-09-11  0:14:07 24517 [Warning] Aborted connection 24517 to db: 'psa' user: 'admin' host: 'localhost' (Got an error reading communication packets)
Sep 11 06:08:48 priceless-mayer mariadbd[1256690]: 2026-09-11  6:08:48 22750 [Warning] Aborted connection 22750 to db: 'fund_opcvm' user: 'fund_opcvm' host: 'localhost' (Got timeout reading communication packets)
Sep 11 06:29:42 priceless-mayer mariadbd[1256690]: 2026-09-11  6:29:42 10970 [Warning] Aborted connection 10970 to db: 'psa' user: 'admin' host: 'localhost' (Got an error reading communication packets)
Sep 11 06:30:44 priceless-mayer mariadbd[1256690]: 2026-09-11  6:30:44 26923 [Warning] Aborted connection 26923 to db: 'unconnected' user: 'unauthenticated' host: 'localhost' (This connection closed normally without authentication)
Sep 11 06:30:44 priceless-mayer mariadbd[1256690]: 2026-09-11  6:30:44 26924 [Warning] Aborted connection 26924 to db: 'unconnected' user: 'unauthenticated' host: 'localhost' (This connection closed normally without authentication)
Sep 11 14:00:15 priceless-mayer mariadbd[1256690]: 2026-09-11 14:00:15 7772 [Warning] Aborted connection 7772 to db: 'fund_opcvm' user: 'fund_opcvm' host: 'localhost' (Got timeout reading communication packets)
Sep 11 22:00:15 priceless-mayer mariadbd[1256690]: 2026-09-11 22:00:15 23143 [Warning] Aborted connection 23143 to db: 'fund_opcvm' user: 'fund_opcvm' host: 'localhost' (Got timeout reading communication packets)

Socket attendu par le client :
srwxrwxrwx 1 mysql mysql 0 Sep  9 06:25 /run/mysqld/mysqld.sock

==============================================
 2. POURQUOI IL S EST ARRETE
==============================================
--- journal du service (30 dernieres lignes) ---
Sep 09 06:25:02 priceless-mayer mariadbd[1256690]: 2026-09-09  6:25:02 0 [Warning] You need to use --log-bin to make --expire-logs-days or --binlog-expire-logs-seconds work.
Sep 09 06:25:02 priceless-mayer mariadbd[1256690]: 2026-09-09  6:25:02 0 [Note] Server socket created on IP: '127.0.0.1'.
Sep 09 06:25:03 priceless-mayer mariadbd[1256690]: 2026-09-09  6:25:03 0 [Note] /usr/sbin/mariadbd: ready for connections.
Sep 09 06:25:03 priceless-mayer mariadbd[1256690]: Version: '10.6.23-MariaDB-0ubuntu0.22.04.1'  socket: '/run/mysqld/mysqld.sock'  port: 3306  Ubuntu 22.04
Sep 09 06:25:03 priceless-mayer mariadbd[1256690]: 2026-09-09  6:25:03 0 [Note] InnoDB: Buffer pool(s) load completed at 260909  6:25:03
Sep 09 06:25:03 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.
Sep 09 06:25:03 priceless-mayer /etc/mysql/debian-start[1256712]: Looking for 'mariadb' as: /usr/bin/mariadb
Sep 09 06:25:03 priceless-mayer /etc/mysql/debian-start[1256712]: Looking for 'mariadb-check' as: /usr/bin/mariadb-check
Sep 09 06:25:03 priceless-mayer /etc/mysql/debian-start[1256712]: This installation of MariaDB is already upgraded to 10.6.7-MariaDB.
Sep 09 06:25:03 priceless-mayer /etc/mysql/debian-start[1256712]: There is no need to run mysql_upgrade again for 10.6.23-MariaDB, because they're both 10.6.
Sep 09 06:25:03 priceless-mayer /etc/mysql/debian-start[1256712]: You can use --force if you still want to run mysql_upgrade
Sep 09 06:25:03 priceless-mayer /etc/mysql/debian-start[1256736]: Triggering myisam-recover for all MyISAM tables and aria-recover for all Aria tables
Sep 09 06:30:07 priceless-mayer mariadbd[1256690]: 2026-09-09  6:30:07 557 [Warning] Aborted connection 557 to db: 'psa' user: 'admin' host: 'localhost' (Got an error reading communication packets)
Sep 09 15:00:13 priceless-mayer mariadbd[1256690]: 2026-09-09 15:00:13 606 [Warning] Aborted connection 606 to db: 'fund_opcvm' user: 'fund_opcvm' host: 'localhost' (Got timeout reading communication packets)
Sep 09 17:12:03 priceless-mayer mariadbd[1256690]: 2026-09-09 17:12:03 902 [Warning] Aborted connection 902 to db: 'psa' user: 'admin' host: 'localhost' (Got timeout reading communication packets)
Sep 10 00:15:08 priceless-mayer mariadbd[1256690]: 2026-09-10  0:15:08 10039 [Warning] Aborted connection 10039 to db: 'psa' user: 'admin' host: 'localhost' (Got an error reading communication packets)
Sep 10 01:19:14 priceless-mayer mariadbd[1256690]: 2026-09-10  1:19:14 64 [Warning] Aborted connection 64 to db: 'psa' user: 'admin' host: 'localhost' (Got an error reading communication packets)
Sep 10 01:19:16 priceless-mayer mariadbd[1256690]: 2026-09-10  1:19:16 10975 [Warning] Aborted connection 10975 to db: 'db_itic4fima' user: 'user_itic4fima' host: 'localhost' (Got an error reading communication packets)
Sep 10 01:19:16 priceless-mayer mariadbd[1256690]: 2026-09-10  1:19:16 10978 [Warning] Aborted connection 10978 to db: 'unconnected' user: 'unauthenticated' host: 'localhost' (This connection closed normally without authentication)
Sep 10 06:06:41 priceless-mayer mariadbd[1256690]: 2026-09-10  6:06:41 7773 [Warning] Aborted connection 7773 to db: 'fund_opcvm' user: 'fund_opcvm' host: 'localhost' (Got timeout reading communication packets)
Sep 10 14:00:14 priceless-mayer mariadbd[1256690]: 2026-09-10 14:00:14 7774 [Warning] Aborted connection 7774 to db: 'fund_opcvm' user: 'fund_opcvm' host: 'localhost' (Got timeout reading communication packets)
Sep 11 00:00:04 priceless-mayer mariadbd[1256690]: 2026-09-11  0:00:04 23940 [Warning] Aborted connection 23940 to db: 'unconnected' user: 'unauthenticated' host: 'localhost' (This connection closed normally without authentication)
Sep 11 00:00:04 priceless-mayer mariadbd[1256690]: 2026-09-11  0:00:04 23941 [Warning] Aborted connection 23941 to db: 'e_vote_db' user: 'e_vote_user' host: 'localhost' (Got an error reading communication packets)
Sep 11 00:14:07 priceless-mayer mariadbd[1256690]: 2026-09-11  0:14:07 24517 [Warning] Aborted connection 24517 to db: 'psa' user: 'admin' host: 'localhost' (Got an error reading communication packets)
Sep 11 06:08:48 priceless-mayer mariadbd[1256690]: 2026-09-11  6:08:48 22750 [Warning] Aborted connection 22750 to db: 'fund_opcvm' user: 'fund_opcvm' host: 'localhost' (Got timeout reading communication packets)
Sep 11 06:29:42 priceless-mayer mariadbd[1256690]: 2026-09-11  6:29:42 10970 [Warning] Aborted connection 10970 to db: 'psa' user: 'admin' host: 'localhost' (Got an error reading communication packets)
Sep 11 06:30:44 priceless-mayer mariadbd[1256690]: 2026-09-11  6:30:44 26923 [Warning] Aborted connection 26923 to db: 'unconnected' user: 'unauthenticated' host: 'localhost' (This connection closed normally without authentication)
Sep 11 06:30:44 priceless-mayer mariadbd[1256690]: 2026-09-11  6:30:44 26924 [Warning] Aborted connection 26924 to db: 'unconnected' user: 'unauthenticated' host: 'localhost' (This connection closed normally without authentication)
Sep 11 14:00:15 priceless-mayer mariadbd[1256690]: 2026-09-11 14:00:15 7772 [Warning] Aborted connection 7772 to db: 'fund_opcvm' user: 'fund_opcvm' host: 'localhost' (Got timeout reading communication packets)
Sep 11 22:00:15 priceless-mayer mariadbd[1256690]: 2026-09-11 22:00:15 23143 [Warning] Aborted connection 23143 to db: 'fund_opcvm' user: 'fund_opcvm' host: 'localhost' (Got timeout reading communication packets)

--- traces de tuerie memoire (OOM) ---

--- memoire disponible ---
               total        used        free      shared  buff/cache   available
Mem:           17945       12097         915         194        4933        5298
Swap:           2047        1747         300

==============================================
 3. REDEMARRAGE
==============================================
Le service est deja actif — aucun redemarrage necessaire.
Etat : active

==============================================
 4. VERIFICATION — la base repond-elle ?
==============================================
srwxrwxrwx 1 mysql mysql 0 Sep  9 06:25 /run/mysqld/mysqld.sock
1258
2026-09-10

--- l API repond-elle de nouveau ? ---
  /api/getfondbypays/MAROC : HTTP 200

==============================================
 FIN
==============================================
```
