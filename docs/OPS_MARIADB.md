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
