# Memoire MySQL — releve

> Genere par `ops-mysql-memoire.yml`. Lecture seule. Ne pas modifier a la main.

Derniere execution : **2026-09-15 00:23 UTC**
Declencheur : `push` — par `Wealthtechinnovations`

```
==============================================
 1. MEMOIRE DE LA MACHINE
==============================================
               total        used        free      shared  buff/cache   available
Mem:           17945        2788         785         210       14372       14595
Swap:           2047         409        1638

RSS actuel de mariadbd :
  0.24 Go — demarre depuis 49:02

==============================================
 2. CE QUE MARIADB S AUTORISE A CONSOMMER
==============================================
--- buffers GLOBAUX (alloues une fois) ---
innodb_buffer_pool_size	134217728
innodb_log_buffer_size	16777216
key_buffer_size	134217728
max_heap_table_size	16777216
query_cache_size	1048576
tmp_table_size	16777216

--- buffers PAR SESSION (multiplies par le nombre de connexions) ---
binlog_cache_size	32768
join_buffer_size	262144
max_allowed_packet	16777216
net_buffer_length	16384
read_buffer_size	131072
read_rnd_buffer_size	262144
sort_buffer_size	2097152
thread_stack	299008

--- connexions ---
max_connections	151
table_open_cache	2000
thread_cache_size	151
Created_tmp_disk_tables	0
Created_tmp_tables	0
Max_used_connections	15
Threads_connected	9
Threads_running	1

==============================================
 2b. MEMORY_USED / PROC / ALLOCATEUR
==============================================
Aborted_connects	6
Connections	770
Created_tmp_disk_tables	5218
Created_tmp_files	4
Created_tmp_tables	5953
Max_used_connections	15
Memory_used	472887056
Memory_used_initial	442210192
Open_files	94
Open_table_definitions	400
Open_tables	615
Opened_files	21936
Opened_table_definitions	689
Opened_tables	622
Threads_connected	9
Threads_created	15
Threads_running	1
Uptime	2941

--- version / instrumentation ---
10.6.23-MariaDB-0ubuntu0.22.04.1	Ubuntu 22.04
aria_pagecache_buffer_size	134217728
performance_schema	OFF
table_definition_cache	400
version_malloc_library	system
MARIADB_PID=2100513
--- /proc status ---
2100513 246976 2792664     49:02   24  1.3 /usr/sbin/mariadbd
VmPeak:	 2923768 kB
VmSize:	 2792664 kB
VmRSS:	  246976 kB
RssAnon:	  223892 kB
RssFile:	   23084 kB
RssShmem:	       0 kB
VmData:	  611012 kB
VmSwap:	       0 kB
Threads:	24
--- smaps_rollup ---
Rss:              249876 kB
Pss:              243613 kB
Pss_Anon:         226456 kB
Pss_File:          17157 kB
Private_Clean:     16544 kB
Private_Dirty:    226456 kB
Anonymous:        226456 kB
AnonHugePages:         0 kB
Swap:                  0 kB
--- pmap totals ---
---------------- ------- ------- ------- 
total kB         2792668  249876  226456
--- allocator libraries ---
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007fd4e3c96000)
--- systemd/cgroup memory ---
Restart=on-abort
Result=success
NRestarts=0
OOMPolicy=stop
MemoryCurrent=261492736
ActiveState=active
SubState=running
[memory.current]
261492736
[memory.swap.current]
0
[memory.events]
low 0
high 0
max 0
oom 0
oom_kill 0
[memory.events.local]
low 0
high 0
max 0
oom 0
oom_kill 0
--- THP ---
always [madvise] never
--- outils/profiler/allocateurs disponibles ---
BPF_MEMLEAK_TOOL=ABSENT
ALT_ALLOCATOR_LIBRARY=ABSENT
--- top mappings pmap par dirty kB ---
00007f3668000000     780     540     540 rw---   [ anon ]
00007f369947f000    1604     540     540 rw---   [ anon ]
00007f3618000000    1668     684     684 rw---   [ anon ]
00007f3608000000    4072     820     820 rw---   [ anon ]
000055ac6c616000    1352    1352    1352 r---- mariadbd
00007f3684172000    2364    2104    2104 rw---   [ anon ]
00007f363c000000    6640    2404    2404 rw---   [ anon ]
00007f3660000000    4200    2444    2444 rw---   [ anon ]
00007f3698054000    4100    4100    4100 rw---   [ anon ]
00007f361c000000    6124    4180    4180 rw---   [ anon ]
000055ac76043000    5884    5080    5080 rw---   [ anon ]
00007f3620000000    6164    5240    5240 rw---   [ anon ]
00007f3698456000   16544    6424    6424 rw---   [ anon ]
00007f3648000000    7336    7092    7092 rw---   [ anon ]
00007f3654000000   10444    7588    7588 rw---   [ anon ]
000055ac6c831000    9060    8712    8712 rw---   [ anon ]
00007f3664000000    9940    9016    9016 rw---   [ anon ]
00007f3644000000   23316   10808   10808 rw---   [ anon ]
00007f3684577000  256548   24740   24740 rw---   [ anon ]
00007f36757ff000  163840  119104  119104 rw---   [ anon ]

--- top connexions par memoire ---
773	fund_opcvm	localhost	Query	0	0.15	0.15
209	fund_opcvm	localhost:60356	Sleep	1277	0.09	0.09
206	fund_opcvm	localhost:60334	Sleep	1275	0.09	0.33
205	fund_opcvm	localhost:60332	Sleep	1274	0.09	0.33
204	fund_opcvm	localhost:60324	Sleep	1274	0.09	0.32
46	fund_opcvm	localhost:40916	Sleep	1274	0.09	3.34
7	fund_opcvm	localhost:48340	Sleep	8	0.09	0.12
55	fund_opcvm	localhost:57702	Sleep	8	0.08	0.11

==============================================
 3. PLAFOND CONFIGURE, PAS RSS REEL
==============================================
0.27	2.94	151	0.70	16	16

  Colonnes : global_Go | par_session_Mo | max_conn | pire_cas_Go | heap_Mo | tmp_Mo\n  Si ce plafond reste tres inferieur au RSS, ne pas conclure a une saturation de buffers.
  Comparer pire_cas_Go a la RAM totale relevee en section 1.
  Rappel : mariadbd a ete tue a 13,7 Go sur 17,9 Go de RAM.

==============================================
 3b. HISTORIQUE DES ARRETS — POURQUOI IL A REDEMARRE
==============================================
--- tueries memoire (OOM) sur 14 jours ---
Sep 14 10:04:11 priceless-mayer kernel: npm start invoked oom-killer: gfp_mask=0x1100cca(GFP_HIGHUSER_MOVABLE), order=0, oom_score_adj=0
Sep 14 10:04:12 priceless-mayer kernel: oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=user.slice,mems_allowed=0,global_oom,task_memcg=/system.slice/mariadb.service,task=mariadbd,pid=1256690,uid=113
Sep 14 10:04:12 priceless-mayer kernel: Out of memory: Killed process 1256690 (mariadbd) total-vm:19512460kB, anon-rss:14902200kB, file-rss:0kB, shmem-rss:0kB, UID:113 pgtables:33628kB oom_score_adj:0

--- demarrages et arrets du service sur 14 jours ---
Sep 14 23:23:31 priceless-mayer mariadbd[2084083]: 2026-09-14 23:23:31 0 [Note] InnoDB: 10.6.23 started; log sequence number 52759760672; transaction id 20362646
Sep 14 23:23:31 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.
Sep 14 23:25:07 priceless-mayer systemd[1]: Stopped MariaDB 10.6.23 database server.
Sep 14 23:25:07 priceless-mayer mariadbd[2085213]: 2026-09-14 23:25:07 0 [Note] InnoDB: 10.6.23 started; log sequence number 52759760684; transaction id 20362646
Sep 14 23:25:07 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.
Sep 14 23:26:25 priceless-mayer systemd[1]: Stopped MariaDB 10.6.23 database server.
Sep 14 23:26:25 priceless-mayer mariadbd[2091380]: 2026-09-14 23:26:25 0 [Note] InnoDB: 10.6.23 started; log sequence number 52759760696; transaction id 20362646
Sep 14 23:26:25 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.
Sep 14 23:27:31 priceless-mayer systemd[1]: Stopped MariaDB 10.6.23 database server.
Sep 14 23:27:31 priceless-mayer mariadbd[2095248]: 2026-09-14 23:27:31 0 [Note] InnoDB: 10.6.23 started; log sequence number 52759760708; transaction id 20362646
Sep 14 23:27:31 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.
Sep 14 23:30:43 priceless-mayer systemd[1]: Stopped MariaDB 10.6.23 database server.
Sep 14 23:30:43 priceless-mayer mariadbd[2097037]: 2026-09-14 23:30:43 0 [Note] InnoDB: 10.6.23 started; log sequence number 52759761703; transaction id 20362669
Sep 14 23:30:43 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.
Sep 14 23:31:43 priceless-mayer systemd[1]: Stopped MariaDB 10.6.23 database server.
Sep 14 23:31:44 priceless-mayer mariadbd[2099901]: 2026-09-14 23:31:44 0 [Note] InnoDB: 10.6.23 started; log sequence number 52759762498; transaction id 20362704
Sep 14 23:31:44 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.
Sep 14 23:32:32 priceless-mayer systemd[1]: Stopped MariaDB 10.6.23 database server.
Sep 14 23:32:32 priceless-mayer mariadbd[2100513]: 2026-09-14 23:32:32 0 [Note] InnoDB: 10.6.23 started; log sequence number 52759762510; transaction id 20362704
Sep 14 23:32:32 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.

==============================================
 4. QUI CONSOMME, MAINTENANT
==============================================
8	fund_opcvm

==============================================
 5. SERIE COURTE RSS vs Memory_used
==============================================
SAMPLE ts=2026-09-15T00:21:35Z rss_kb=246976 rssanon_kb=223892 swap_kb=0 mariadb_memory_used_bytes=471838000 connections=9
SAMPLE ts=2026-09-15T00:21:50Z rss_kb=246976 rssanon_kb=223892 swap_kb=0 mariadb_memory_used_bytes=471838072 connections=9
SAMPLE ts=2026-09-15T00:22:05Z rss_kb=246976 rssanon_kb=223892 swap_kb=0 mariadb_memory_used_bytes=471838472 connections=9
SAMPLE ts=2026-09-15T00:22:20Z rss_kb=246976 rssanon_kb=223892 swap_kb=0 mariadb_memory_used_bytes=471838560 connections=9
SAMPLE ts=2026-09-15T00:22:35Z rss_kb=246976 rssanon_kb=223892 swap_kb=0 mariadb_memory_used_bytes=471838512 connections=9
SAMPLE ts=2026-09-15T00:22:50Z rss_kb=246976 rssanon_kb=223892 swap_kb=0 mariadb_memory_used_bytes=471838376 connections=9

==============================================
 6. CORRELATION CRONS / RSS — 2026-09-14
==============================================
Fenetre : redemarrage MariaDB 14:00 UTC -> mesure RSS ~6.7 Gio a 22:49 UTC.

--- crontab live pertinent ---
0 10 * * 1 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_nigeria_weekly.sh >> /var/log/africafunds_nigeria.log 2>&1
0 20 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_daily_update.sh >> /var/log/africafunds_cron.log 2>&1
0 * * * * cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/deploy/sync_production.sh >> /var/log/sync_production.log 2>&1
30 21 * * * cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_daily_eur_usd.sh >> /var/log/cron_eur_usd.log 2>&1
0 19 * * 1-5  cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_tunisie_daily.sh >> /var/log/cron_tunisie.log 2>&1
0 22 * * *    cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_health_check.sh >> /var/log/africafunds_health.log 2>&1
30 19 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_brvm_daily.sh >> /var/log/cron_brvm.log 2>&1
30 18 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_indices_daily.sh >> /var/log/cron_indices_daily.log 2>&1

--- journal cron 14:00-23:00 UTC ---
2026-09-14T21:40:01+0000 priceless-mayer CRON[2024740]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T21:41:01+0000 priceless-mayer CRON[2025144]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:41:01+0000 priceless-mayer CRON[2025143]: (root) CMD ([ -x /opt/psa/admin/sbin/backupmng ] && /opt/psa/admin/sbin/backupmng >/dev/null 2>&1)
2026-09-14T21:41:01+0000 priceless-mayer CRON[2025145]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:42:01+0000 priceless-mayer CRON[2025555]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:42:01+0000 priceless-mayer CRON[2025556]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:43:01+0000 priceless-mayer CRON[2025956]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:43:01+0000 priceless-mayer CRON[2025957]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:44:01+0000 priceless-mayer CRON[2026373]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:44:01+0000 priceless-mayer CRON[2026374]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:45:02+0000 priceless-mayer CRON[2026781]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:45:02+0000 priceless-mayer CRON[2026782]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T21:45:02+0000 priceless-mayer CRON[2026783]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T21:45:02+0000 priceless-mayer CRON[2026784]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:46:01+0000 priceless-mayer CRON[2027162]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:46:01+0000 priceless-mayer CRON[2027168]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:47:01+0000 priceless-mayer CRON[2027560]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:47:01+0000 priceless-mayer CRON[2027561]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:48:01+0000 priceless-mayer CRON[2027961]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:48:01+0000 priceless-mayer CRON[2027962]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:49:01+0000 priceless-mayer CRON[2028359]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')
2026-09-14T21:49:01+0000 priceless-mayer CRON[2028360]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:49:01+0000 priceless-mayer CRON[2028361]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:50:01+0000 priceless-mayer CRON[2028783]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:50:01+0000 priceless-mayer CRON[2028784]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:50:01+0000 priceless-mayer CRON[2028785]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T21:50:01+0000 priceless-mayer CRON[2028786]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T21:51:01+0000 priceless-mayer CRON[2029452]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:51:01+0000 priceless-mayer CRON[2029453]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:52:01+0000 priceless-mayer CRON[2029846]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:52:01+0000 priceless-mayer CRON[2029847]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:53:01+0000 priceless-mayer CRON[2030250]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:53:01+0000 priceless-mayer CRON[2030251]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:53:01+0000 priceless-mayer CRON[2030252]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/log-browser/scripts/parse-logs.php')
2026-09-14T21:54:01+0000 priceless-mayer CRON[2030698]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:54:01+0000 priceless-mayer CRON[2030699]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:54:01+0000 priceless-mayer CRON[2030700]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/xovi/scripts/seo-kpi.php')
2026-09-14T21:55:01+0000 priceless-mayer CRON[2031557]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T21:55:01+0000 priceless-mayer CRON[2031558]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T21:55:01+0000 priceless-mayer CRON[2031561]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:55:01+0000 priceless-mayer CRON[2031562]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:56:01+0000 priceless-mayer CRON[2031980]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:56:01+0000 priceless-mayer CRON[2031981]: (root) CMD ([ -x /opt/psa/admin/sbin/backupmng ] && /opt/psa/admin/sbin/backupmng >/dev/null 2>&1)
2026-09-14T21:56:01+0000 priceless-mayer CRON[2031982]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:57:01+0000 priceless-mayer CRON[2032403]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:57:01+0000 priceless-mayer CRON[2032404]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:57:01+0000 priceless-mayer CRON[2032405]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/sslit/scripts/keep-secured.php')
2026-09-14T21:58:01+0000 priceless-mayer CRON[2032820]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:58:01+0000 priceless-mayer CRON[2032821]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:59:01+0000 priceless-mayer CRON[2033237]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T21:59:01+0000 priceless-mayer CRON[2033238]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T21:59:01+0000 priceless-mayer CRON[2033239]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')
2026-09-14T22:00:01+0000 priceless-mayer CRON[2033663]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:00:01+0000 priceless-mayer CRON[2033664]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:00:01+0000 priceless-mayer CRON[2033666]: (root) CMD (   bash -c 'sleep $((RANDOM % 1800))' ;imunify-antivirus imunify-patch subscriptions refresh > /dev/null 2>&1)
2026-09-14T22:00:01+0000 priceless-mayer CRON[2033671]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:00:01+0000 priceless-mayer CRON[2033676]: (root) CMD (cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_health_check.sh >> /var/log/africafunds_health.log 2>&1)
2026-09-14T22:00:01+0000 priceless-mayer CRON[2033674]: (root) CMD (cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/deploy/sync_production.sh >> /var/log/sync_production.log 2>&1)
2026-09-14T22:00:01+0000 priceless-mayer CRON[2033685]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')
2026-09-14T22:00:01+0000 priceless-mayer CRON[2033688]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:01:01+0000 priceless-mayer CRON[2034164]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:01:01+0000 priceless-mayer CRON[2034165]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:02:01+0000 priceless-mayer CRON[2034713]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/wp-toolkit/scripts/maintenance.php')
2026-09-14T22:02:01+0000 priceless-mayer CRON[2034712]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:02:01+0000 priceless-mayer CRON[2034714]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:03:01+0000 priceless-mayer CRON[2035201]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:03:01+0000 priceless-mayer CRON[2035202]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:04:01+0000 priceless-mayer CRON[2035593]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:04:01+0000 priceless-mayer CRON[2035594]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:05:01+0000 priceless-mayer CRON[2036004]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:05:01+0000 priceless-mayer CRON[2036006]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:05:01+0000 priceless-mayer CRON[2036007]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:05:01+0000 priceless-mayer CRON[2036008]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:06:01+0000 priceless-mayer CRON[2036419]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:06:01+0000 priceless-mayer CRON[2036420]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:07:01+0000 priceless-mayer CRON[2036836]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:07:01+0000 priceless-mayer CRON[2036837]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:08:01+0000 priceless-mayer CRON[2037515]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:08:01+0000 priceless-mayer CRON[2037516]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:09:01+0000 priceless-mayer CRON[2037922]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:09:01+0000 priceless-mayer CRON[2037921]: (root) CMD (  [ -x /usr/lib/php/sessionclean ] && if [ ! -d /run/systemd/system ]; then /usr/lib/php/sessionclean; fi)
2026-09-14T22:09:01+0000 priceless-mayer CRON[2037923]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:09:01+0000 priceless-mayer CRON[2037925]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')
2026-09-14T22:10:01+0000 priceless-mayer CRON[2038418]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:10:01+0000 priceless-mayer CRON[2038419]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:10:01+0000 priceless-mayer CRON[2038420]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:10:01+0000 priceless-mayer CRON[2038421]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:11:01+0000 priceless-mayer CRON[2038830]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:11:01+0000 priceless-mayer CRON[2038831]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:11:01+0000 priceless-mayer CRON[2038832]: (root) CMD ([ -x /opt/psa/admin/sbin/backupmng ] && /opt/psa/admin/sbin/backupmng >/dev/null 2>&1)
2026-09-14T22:12:01+0000 priceless-mayer CRON[2039233]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:12:01+0000 priceless-mayer CRON[2039234]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:13:01+0000 priceless-mayer CRON[2039625]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:13:01+0000 priceless-mayer CRON[2039626]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:14:01+0000 priceless-mayer CRON[2040031]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:14:01+0000 priceless-mayer CRON[2040030]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:15:01+0000 priceless-mayer CRON[2040436]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:15:01+0000 priceless-mayer CRON[2040437]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:15:01+0000 priceless-mayer CRON[2040438]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:15:01+0000 priceless-mayer CRON[2040439]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/sslit/scripts/panel-notifications.php')
2026-09-14T22:15:01+0000 priceless-mayer CRON[2040440]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:16:01+0000 priceless-mayer CRON[2040838]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:16:01+0000 priceless-mayer CRON[2040839]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:17:01+0000 priceless-mayer CRON[2041252]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:17:01+0000 priceless-mayer CRON[2041253]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:17:01+0000 priceless-mayer CRON[2041254]: (root) CMD (   cd / && run-parts --report /etc/cron.hourly)
2026-09-14T22:18:01+0000 priceless-mayer CRON[2041743]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:18:01+0000 priceless-mayer CRON[2041744]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:19:01+0000 priceless-mayer CRON[2042144]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:19:01+0000 priceless-mayer CRON[2042145]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')
2026-09-14T22:19:01+0000 priceless-mayer CRON[2042147]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:20:01+0000 priceless-mayer CRON[2042553]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:20:01+0000 priceless-mayer CRON[2042554]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:20:01+0000 priceless-mayer CRON[2042555]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:20:01+0000 priceless-mayer CRON[2042556]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:21:01+0000 priceless-mayer CRON[2043126]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:21:01+0000 priceless-mayer CRON[2043127]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:21:01+0000 priceless-mayer CRON[2043128]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/detect-hardware-changes.php')
2026-09-14T22:22:01+0000 priceless-mayer CRON[2043660]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:22:01+0000 priceless-mayer CRON[2043661]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:22:01+0000 priceless-mayer CRON[2043662]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/galileo/scripts/galileo-every-hour.php')
2026-09-14T22:23:01+0000 priceless-mayer CRON[2044173]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:23:01+0000 priceless-mayer CRON[2044174]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:24:01+0000 priceless-mayer CRON[2044576]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:24:01+0000 priceless-mayer CRON[2044577]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:25:01+0000 priceless-mayer CRON[2044988]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:25:01+0000 priceless-mayer CRON[2044989]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:25:01+0000 priceless-mayer CRON[2044990]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:25:01+0000 priceless-mayer CRON[2044991]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:26:01+0000 priceless-mayer CRON[2045391]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:26:01+0000 priceless-mayer CRON[2045392]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:26:01+0000 priceless-mayer CRON[2045393]: (root) CMD ([ -x /opt/psa/admin/sbin/backupmng ] && /opt/psa/admin/sbin/backupmng >/dev/null 2>&1)
2026-09-14T22:27:01+0000 priceless-mayer CRON[2045801]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:27:01+0000 priceless-mayer CRON[2045800]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:28:01+0000 priceless-mayer CRON[2046194]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:28:01+0000 priceless-mayer CRON[2046195]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:29:01+0000 priceless-mayer CRON[2046592]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:29:01+0000 priceless-mayer CRON[2046593]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')
2026-09-14T22:29:01+0000 priceless-mayer CRON[2046594]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:30:01+0000 priceless-mayer CRON[2047001]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:30:01+0000 priceless-mayer CRON[2047002]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:30:01+0000 priceless-mayer CRON[2047003]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:30:01+0000 priceless-mayer CRON[2047004]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:31:01+0000 priceless-mayer CRON[2047422]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:31:01+0000 priceless-mayer CRON[2047423]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:32:01+0000 priceless-mayer CRON[2047830]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:32:01+0000 priceless-mayer CRON[2047831]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:33:01+0000 priceless-mayer CRON[2048230]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:33:01+0000 priceless-mayer CRON[2048231]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:34:01+0000 priceless-mayer CRON[2049181]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:34:01+0000 priceless-mayer CRON[2049182]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:35:01+0000 priceless-mayer CRON[2049583]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:35:01+0000 priceless-mayer CRON[2049582]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:35:01+0000 priceless-mayer CRON[2049584]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:35:01+0000 priceless-mayer CRON[2049585]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/sslit/scripts/complete-order.php')
2026-09-14T22:35:01+0000 priceless-mayer CRON[2049586]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:36:01+0000 priceless-mayer CRON[2049987]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:36:01+0000 priceless-mayer CRON[2049988]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:37:01+0000 priceless-mayer CRON[2050383]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:37:01+0000 priceless-mayer CRON[2050384]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:38:01+0000 priceless-mayer CRON[2050777]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:38:01+0000 priceless-mayer CRON[2050778]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:39:01+0000 priceless-mayer CRON[2051172]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:39:01+0000 priceless-mayer CRON[2051173]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:39:01+0000 priceless-mayer CRON[2051174]: (root) CMD (  [ -x /usr/lib/php/sessionclean ] && if [ ! -d /run/systemd/system ]; then /usr/lib/php/sessionclean; fi)
2026-09-14T22:39:01+0000 priceless-mayer CRON[2051175]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')
2026-09-14T22:40:01+0000 priceless-mayer CRON[2051666]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:40:01+0000 priceless-mayer CRON[2051667]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:40:01+0000 priceless-mayer CRON[2051665]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:40:01+0000 priceless-mayer CRON[2051668]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:41:01+0000 priceless-mayer CRON[2052064]: (root) CMD ([ -x /opt/psa/admin/sbin/backupmng ] && /opt/psa/admin/sbin/backupmng >/dev/null 2>&1)
2026-09-14T22:42:01+0000 priceless-mayer CRON[2052474]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:42:01+0000 priceless-mayer CRON[2052475]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:43:01+0000 priceless-mayer CRON[2052872]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:43:01+0000 priceless-mayer CRON[2052871]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:44:01+0000 priceless-mayer CRON[2053270]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:44:01+0000 priceless-mayer CRON[2053271]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:45:01+0000 priceless-mayer CRON[2053672]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:45:01+0000 priceless-mayer CRON[2053673]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:45:01+0000 priceless-mayer CRON[2053674]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:45:01+0000 priceless-mayer CRON[2053675]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:46:01+0000 priceless-mayer CRON[2054076]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:46:01+0000 priceless-mayer CRON[2054077]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:47:01+0000 priceless-mayer CRON[2054476]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:47:01+0000 priceless-mayer CRON[2054477]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:48:01+0000 priceless-mayer CRON[2054867]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:48:01+0000 priceless-mayer CRON[2054868]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:49:01+0000 priceless-mayer CRON[2055441]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:49:01+0000 priceless-mayer CRON[2055442]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:49:01+0000 priceless-mayer CRON[2055443]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')
2026-09-14T22:50:01+0000 priceless-mayer CRON[2055900]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:50:01+0000 priceless-mayer CRON[2055901]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:50:01+0000 priceless-mayer CRON[2055903]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:50:01+0000 priceless-mayer CRON[2055902]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:51:01+0000 priceless-mayer CRON[2056295]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:51:01+0000 priceless-mayer CRON[2056296]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:52:01+0000 priceless-mayer CRON[2056697]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:52:01+0000 priceless-mayer CRON[2056698]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:53:01+0000 priceless-mayer CRON[2057306]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:53:01+0000 priceless-mayer CRON[2057307]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/log-browser/scripts/parse-logs.php')
2026-09-14T22:53:01+0000 priceless-mayer CRON[2057308]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:54:01+0000 priceless-mayer CRON[2057812]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:54:01+0000 priceless-mayer CRON[2057811]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:54:01+0000 priceless-mayer CRON[2057813]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/xovi/scripts/seo-kpi.php')
2026-09-14T22:55:01+0000 priceless-mayer CRON[2058196]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T22:55:01+0000 priceless-mayer CRON[2058194]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:55:01+0000 priceless-mayer CRON[2058195]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:55:01+0000 priceless-mayer CRON[2058197]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T22:56:01+0000 priceless-mayer CRON[2058588]: (root) CMD ([ -x /opt/psa/admin/sbin/backupmng ] && /opt/psa/admin/sbin/backupmng >/dev/null 2>&1)
2026-09-14T22:56:01+0000 priceless-mayer CRON[2058589]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:56:01+0000 priceless-mayer CRON[2058590]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:57:01+0000 priceless-mayer CRON[2058992]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:57:01+0000 priceless-mayer CRON[2058991]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:57:01+0000 priceless-mayer CRON[2058993]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/sslit/scripts/keep-secured.php')
2026-09-14T22:58:01+0000 priceless-mayer CRON[2059402]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:58:01+0000 priceless-mayer CRON[2059403]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/advisor/scripts/update-config.php')
2026-09-14T22:58:01+0000 priceless-mayer CRON[2059404]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:59:01+0000 priceless-mayer CRON[2059819]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T22:59:01+0000 priceless-mayer CRON[2059820]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T22:59:01+0000 priceless-mayer CRON[2059821]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')

--- daily 20h : stat + jalons uniquement ---
FILE=/var/log/africafunds_daily_20260914.log size=16515 mtime=2026-09-14 21:13:15.284247576 +0000
========================================
=== AFRICAFUNDS DAILY UPDATE ===
=== Mon Sep 14 08:00:01 PM UTC 2026 ===
========================================
[1/9] Scrape ASFIM VL Maroc (2026-09-09 -> 2026-09-14)...
==========================================
=== RAPPORT SCRAPE & IMPORT ASFIM ===
==========================================
[1/9] OK
[2/9] Mise a jour Forex (derniers jours)...
==========================================
=== RAPPORT IMPORT FOREX ===
==========================================
[2/9] OK
[3/9] Recalcul EUR/USD daily rates...
1251 fonds a traiter
==========================================
=== RAPPORT RECALCUL EUR/USD QUOTIDIEN ===
==========================================
Fonds traites:             1249
[3/9] OK
[4/9] Recalcul VL Ajuste (tous fonds actifs)...
1251 fonds a traiter
==========================================
=== RAPPORT RECALCUL VL AJUSTE ===
==========================================
Fonds traites:             1250
[4/9] OK
[5/9] Recalcul performances locale (fonds 1-600)...
{"message":"Performances locales: 25/25 fonds traites, 0 erreur(s)","total":25,"traites":25,"erreurs":0}[5/9] OK (HTTP 200)
[6/9] Recalcul performances locale (fonds 601-1200)...
[6/9] ERREUR (HTTP 000)
[7/9] Recalcul performances locale (fonds 1201-3000)...
[7/9] ERREUR (HTTP 000)
[8/9] Recalcul performances EUR/USD...
============================================================
=== EUR — table: performences_eurs ===
============================================================
Fonds traites:    1242
============================================================
=== USD — table: performences_usds ===
============================================================
Fonds traites:    1242
============================================================
=== VERIFICATION FINALE ===
============================================================
performences_eurs: 32698 lignes, 1243 fonds
performences_usds: 32931 lignes, 1243 fonds
[8/9] OK
[9a/9] Classement local...
[9b/9] Classement EUR...
[9c/9] Classement USD...
=== MISE A JOUR TERMINEE AVEC 2 ERREUR(S) Mon Sep 14 09:13:15 PM UTC 2026 ===
========================================

--- sortie cron principale redirigee ---
FILE=/var/log/africafunds_cron.log size=1320266 mtime=2026-09-14 21:13:15.284247576 +0000
=== AFRICAFUNDS DAILY UPDATE ===
=== Mon Sep 14 08:00:01 PM UTC 2026 ===
========================================
[1/9] Scrape ASFIM VL Maroc (2026-09-09 -> 2026-09-14)...
==========================================
=== RAPPORT SCRAPE & IMPORT ASFIM ===
==========================================
[1/9] OK
[2/9] Mise a jour Forex (derniers jours)...
==========================================
=== RAPPORT IMPORT FOREX ===
==========================================
[2/9] OK
[3/9] Recalcul EUR/USD daily rates...
1251 fonds a traiter
==========================================
=== RAPPORT RECALCUL EUR/USD QUOTIDIEN ===
==========================================
Fonds traites:             1249
[3/9] OK
[4/9] Recalcul VL Ajuste (tous fonds actifs)...
1251 fonds a traiter
==========================================
=== RAPPORT RECALCUL VL AJUSTE ===
==========================================
Fonds traites:             1250
[4/9] OK
[5/9] Recalcul performances locale (fonds 1-600)...
[5/9] OK (HTTP 200)
[6/9] Recalcul performances locale (fonds 601-1200)...
[6/9] ERREUR (HTTP 000)
[7/9] Recalcul performances locale (fonds 1201-3000)...
[7/9] ERREUR (HTTP 000)
[8/9] Recalcul performances EUR/USD...
============================================================
=== EUR — table: performences_eurs ===
============================================================
Fonds traites:    1242
============================================================
=== USD — table: performences_usds ===
============================================================
Fonds traites:    1242
============================================================
=== VERIFICATION FINALE ===
============================================================
performences_eurs: 32698 lignes, 1243 fonds
performences_usds: 32931 lignes, 1243 fonds
[8/9] OK
[9a/9] Classement local...
[9a/9] OK (HTTP 200)
[9b/9] Classement EUR...
[9b/9] OK (HTTP 200)
[9c/9] Classement USD...
[9c/9] OK (HTTP 200)
=== MISE A JOUR TERMINEE AVEC 2 ERREUR(S) Mon Sep 14 09:13:15 PM UTC 2026 ===

--- cron EUR/USD 21h30 : bloc du 2026-09-14 ---
FILE=/var/log/cron_eur_usd.log size=144769 mtime=2026-09-14 22:06:32.087487361 +0000
CRON EUR/USD — 2026-09-14 21:30:01
============================================
--- [1/3] Performances EUR + USD ---
Par pays:
  MAROC: 644 fonds
  NIGERIA: 315 fonds
  TUNISIE: 131 fonds
  UEMOA: 108 fonds
  CEMAC: 34 fonds
  Nigeria: 10 fonds

============================================================
=== VERIFICATION FINALE ===
============================================================
performences_eurs: 32698 lignes, 1243 fonds
performences_usds: 32931 lignes, 1243 fonds

Termine.
[1/3] OK

--- [2/3] Classements EUR ---

000

[2a/3] ERREUR (HTTP 000)
--- Classements USD ---

000

[2b/3] ERREUR (HTTP 000)

--- [3/3] Verification ---
  performences_eurs        32698 lignes / 1243 fonds
  performences_usds        32931 lignes / 1243 fonds
  classementfonds_eurs     3637 lignes / 1237 fonds
  classementfonds_usds     3637 lignes / 1237 fonds

CRON EUR/USD TERMINE AVEC 2 ERREUR(S) — 2026-09-14 22:06:32

--- health 22h : bloc du 2026-09-14 ---
FILE=/var/log/africafunds_health_20260914.log size=1813 mtime=2026-09-14 22:00:04.147887566 +0000
========================================
=== AFRICAFUNDS HEALTH CHECK ===
=== Mon Sep 14 10:00:01 PM UTC 2026 ===
========================================
=== AFRICAFUNDS CRON HEALTH CHECK — 2026-09-14 ===
--- Derniere VL par pays ---
  UEMOA        derniere VL: 2026-09-11 (3j / budget 6j) — 111 fonds — OK
  MAROC        derniere VL: 2026-09-11 (3j / budget 6j) — 644 fonds — OK
  NIGERIA      derniere VL: 2026-08-28 (17j / budget 14j) — 330 fonds — ALERTE
  TUNISIE      derniere VL: 2026-08-28 (17j / budget 9j) — 131 fonds — ALERTE
  CEMAC        derniere VL: 2024-12-12 (641j / budget 400j) — 34 fonds — ALERTE
  Derniere date performances (MAX brut, tous fonds confondus): 2026-09-11 (3j)
  Performances qui suivent la VL: 395/1234 (32.0 %), retard moyen 69.8 j
--- Fichiers log cron ---
  eur_usd      /var/log/cron_eur_usd.log — 141 Ko, modifie il y a 0h
=== RESUME ===
STATUT: 5 PROBLEME(S) DETECTE(S)
  [!] NIGERIA: derniere VL il y a 17 jours (budget 14j)
  [!] TUNISIE: derniere VL il y a 17 jours (budget 9j)
  [!] CEMAC: derniere VL il y a 641 jours (budget 400j)
  [!] Performances en retard sur les VL: 395/1234 a jour (32.0 %), retard moyen 69.8 j
  [OK] UEMOA: VL a jour
  [OK] MAROC: VL a jour
  [OK] Classement local peuple
  [OK] Forex a jour
=== HEALTH CHECK TERMINE Mon Sep 14 10:00:04 PM UTC 2026 ===
========================================

--- MariaDB journal 14:00-23:00 UTC ---
2026-09-14T14:00:30+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 14:00:30 0 [Note] InnoDB: 10.6.23 started; log sequence number 52725173903; transaction id 20336935
2026-09-14T14:00:30+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 14:00:30 0 [Warning] You need to use --log-bin to make --expire-logs-days or --binlog-expire-logs-seconds work.
2026-09-14T14:00:30+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 14:00:30 0 [Note] /usr/sbin/mariadbd: ready for connections.
2026-09-14T14:00:30+0000 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.
2026-09-14T14:00:30+0000 priceless-mayer /etc/mysql/debian-start[1784136]: This installation of MariaDB is already upgraded to 10.6.7-MariaDB.
2026-09-14T14:04:40+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 14:04:40 79 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T14:56:04+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 14:56:04 324 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T14:56:07+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 14:56:07 325 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T15:33:46+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 15:33:46 517 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T16:49:49+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 16:49:49 746 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T16:58:34+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 16:58:34 772 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T17:27:34+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 17:27:34 856 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T17:27:36+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 17:27:36 857 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T17:42:00+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 17:42:00 886 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T17:42:04+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 17:42:04 889 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:25:32+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:25:32 1100 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:25:35+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:25:35 1101 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:38:23+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:38:23 1132 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:38:38+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:38:38 1133 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:38:41+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:38:41 1134 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:38:45+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:38:45 1137 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:38:51+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:38:51 1140 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:38:57+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:38:57 1143 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:41:44+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:41:44 1150 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:42:41+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:42:41 1151 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:42:45+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:42:45 1154 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:43:46+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:43:46 1157 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:45:50+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:45:50 1160 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:47:41+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:47:41 1162 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:47:45+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:47:45 1163 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:47:49+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:47:49 1166 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:47:52+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:47:52 1169 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:47:55+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:47:55 1172 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:47:59+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:47:59 1173 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:02+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:02 1174 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:11+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:11 1178 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:15+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:15 1181 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:18+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:18 1184 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:21+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:21 1185 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:24+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:24 1187 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:28+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:28 1191 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:31+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:31 1195 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:35+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:35 1199 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:39+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:39 1200 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:42+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:42 1201 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:50+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:50 1204 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:53+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:53 1207 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:48:57+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:48:57 1210 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:01+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:01 1212 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:06+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:06 1213 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:10+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:10 1216 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:15+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:15 1219 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:20+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:20 1222 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:26+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:26 1223 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:32+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:32 1224 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:38+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:38 1227 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:42+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:42 1230 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:47+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:47 1233 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:53+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:53 1234 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:49:57+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:49:57 1235 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:50:06+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:50:06 1238 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:50:14+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:50:14 1241 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:50:20+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:50:20 1244 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:50:24+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:50:24 1245 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:50:28+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:50:28 1246 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:50:34+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:50:34 1249 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:50:39+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:50:39 1252 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:50:45+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:50:45 1255 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:50:53+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:50:53 1256 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:50:59+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:50:59 1257 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:51:06+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:51:06 1260 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:51:12+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:51:12 1263 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:51:21+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:51:21 1266 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:51:33+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:51:33 1267 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:51:40+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:51:40 1268 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:51:48+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:51:48 1271 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:51:57+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:51:57 1274 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:52:10+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:52:10 1278 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:52:17+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:52:17 1279 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:52:26+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:52:26 1280 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:52:32+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:52:32 1283 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:52:38+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:52:38 1286 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:52:49+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:52:49 1289 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:52:54+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:52:54 1291 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:53:17+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:53:17 1294 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:53:21+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:53:21 1297 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:54:11+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:54:11 1301 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:54:16+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:54:16 1304 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:54:21+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:54:21 1305 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:54:27+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:54:27 1306 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:54:30+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:54:30 1309 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:54:44+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:54:44 1312 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:54:48+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:54:48 1315 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:13+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:13 1316 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:16+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:16 1317 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:19+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:19 1320 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:23+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:23 1323 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:26+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:26 1326 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:29+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:29 1327 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:32+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:32 1328 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:32+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:32 1322 [Warning] Aborted connection 1322 to db: 'db_stablecoin' user: 'user_stablecoin' host: 'localhost' (Got an error reading communication packets)
2026-09-14T19:55:34+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:34 1331 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:38+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:38 1334 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:43+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:43 1337 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:46+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:46 1338 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:48+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:48 1339 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:52+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:52 1342 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:55+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:55 1345 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:55:58+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:55:58 1348 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:01+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:01 1349 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:01+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:01 1341 [Warning] Aborted connection 1341 to db: 'e_vote_db' user: 'e_vote_user' host: 'localhost' (Got an error reading communication packets)
2026-09-14T19:56:04+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:04 1351 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:04+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:04 1344 [Warning] Aborted connection 1344 to db: 'db_stablecoin' user: 'user_stablecoin' host: 'localhost' (Got an error reading communication packets)
2026-09-14T19:56:07+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:07 1354 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:09+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:09 1357 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:13+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:13 1360 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:16+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:16 1361 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:19+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:19 1362 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:19+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:19 1356 [Warning] Aborted connection 1356 to db: 'db_stablecoin' user: 'user_stablecoin' host: 'localhost' (Got an error reading communication packets)
2026-09-14T19:56:22+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:22 1365 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:25+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:25 1368 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:28+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:28 1371 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:31+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:31 1372 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:31+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:31 1364 [Warning] Aborted connection 1364 to db: 'e_vote_db' user: 'e_vote_user' host: 'localhost' (Got an error reading communication packets)
2026-09-14T19:56:34+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:34 1373 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:34+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:34 1367 [Warning] Aborted connection 1367 to db: 'db_stablecoin' user: 'user_stablecoin' host: 'localhost' (Got an error reading communication packets)
2026-09-14T19:56:37+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:37 1376 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:40+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:40 1379 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:43+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:43 1382 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:49+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:49 1383 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:52+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:52 1384 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:54+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:54 1387 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:56:57+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:56:57 1390 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:57:00+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:57:00 1393 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:57:04+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:57:04 1395 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:57:07+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:57:07 1396 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:57:10+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:57:10 1399 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:57:13+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:57:13 1403 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:57:17+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:57:17 1406 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:57:21+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:57:21 1407 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:58:57+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:58:57 1408 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:00+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:00 1411 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:03+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:03 1415 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:06+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:06 1416 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:09+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:09 1417 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:10+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:10 1410 [Warning] Aborted connection 1410 to db: 'e_vote_db' user: 'e_vote_user' host: 'localhost' (Got an error reading communication packets)
2026-09-14T19:59:12+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:12 1420 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:17+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:17 1423 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:22+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:22 1426 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:22+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:22 1419 [Warning] Aborted connection 1419 to db: 'db_stablecoin' user: 'user_stablecoin' host: 'localhost' (Got an error reading communication packets)
2026-09-14T19:59:24+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:24 1427 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:25+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:25 1422 [Warning] Aborted connection 1422 to db: 'e_vote_db' user: 'e_vote_user' host: 'localhost' (Got an error reading communication packets)
2026-09-14T19:59:28+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:28 1430 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:28+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:28 1425 [Warning] Aborted connection 1425 to db: 'db_itic4fima' user: 'user_itic4fima' host: 'localhost' (Got an error reading communication packets)
2026-09-14T19:59:30+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:30 1433 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:34+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:34 1436 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:37+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:37 1437 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:41+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:41 1438 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:47+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:47 1441 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:51+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:51 1444 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T19:59:54+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 19:59:54 1447 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T20:16:21+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 20:16:21 1496 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T20:16:24+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 20:16:24 1497 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T20:32:22+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 20:32:22 1528 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T20:32:24+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 20:32:24 1531 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T20:40:03+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 20:40:03 1560 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T20:40:08+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 20:40:08 1561 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T22:07:57+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 22:07:57 1803 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T22:33:27+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 22:33:27 1861 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)
2026-09-14T22:33:33+0000 priceless-mayer mariadbd[1784030]: 2026-09-14 22:33:33 1862 [Warning] Access denied for user 'fund_opcvm'@'localhost' (using password: YES)

--- kernel OOM 14:00-23:00 UTC ---

==============================================
 7. HANDLERS BATCH API — PREUVE DE CONTINUATION
==============================================
--- logs.txt processFundmysql ---
FILE=logs.txt size=91994354 mtime=2026-09-14 22:04:43.292709001 +0000
finish_count=1219
last_finish_ids:
finish l'ID 2883
finish l'ID 2884
finish l'ID 2892
finish l'ID 2896
finish l'ID 2897
finish l'ID 2900
finish l'ID 1100
finish l'ID 2901
finish l'ID 2902
finish l'ID 2903
finish l'ID 2904
finish l'ID 2905
finish l'ID 2912
finish l'ID 2922
finish l'ID 2923
finish l'ID 2924
finish l'ID 2925
finish l'ID 2926
finish l'ID 2927
finish l'ID 2928
finish l'ID 2929
finish l'ID 2930
finish l'ID 2931
finish l'ID 1101
finish l'ID 1102
finish l'ID 1103
finish l'ID 1104
finish l'ID 1105
finish l'ID 1106
finish l'ID 1107
finish l'ID 1108
finish l'ID 1109
finish l'ID 1110
finish l'ID 1111
finish l'ID 1112
finish l'ID 1113
finish l'ID 1114
finish l'ID 1115
finish l'ID 1116
finish l'ID 1117
finish l'ID 1118
finish l'ID 1119
finish l'ID 1120
finish l'ID 1121
finish l'ID 1122
finish l'ID 1123
finish l'ID 1124
finish l'ID 1125
finish l'ID 1126
finish l'ID 1127
finish l'ID 1128
finish l'ID 1129
finish l'ID 1130
finish l'ID 1131
finish l'ID 1132
finish l'ID 1133
finish l'ID 1134
finish l'ID 1135
finish l'ID 1136
finish l'ID 1137
finish l'ID 1141
finish l'ID 1142
finish l'ID 1143
finish l'ID 1144
finish l'ID 1145
finish l'ID 1146
finish l'ID 1147
finish l'ID 1148
finish l'ID 1149
finish l'ID 1150
finish l'ID 1151
finish l'ID 1152
finish l'ID 1153
finish l'ID 1154
finish l'ID 1155
finish l'ID 1156
finish l'ID 1157
finish l'ID 1158
finish l'ID 1159
finish l'ID 1160
finish l'ID 1161
finish l'ID 1162
finish l'ID 1163
finish l'ID 1164
finish l'ID 1165
finish l'ID 1166
finish l'ID 1167
finish l'ID 1168
finish l'ID 1169
finish l'ID 1170
finish l'ID 1171
finish l'ID 1172
finish l'ID 1173
finish l'ID 1174
finish l'ID 1175
finish l'ID 1176
finish l'ID 1177
finish l'ID 1178
finish l'ID 1179
finish l'ID 1180
finish l'ID 1181
finish l'ID 1182
finish l'ID 1183
finish l'ID 1184
finish l'ID 1185
finish l'ID 1186
finish l'ID 1187
finish l'ID 1188
finish l'ID 1189
finish l'ID 1190
finish l'ID 1191
finish l'ID 1192
finish l'ID 1193
finish l'ID 1194
finish l'ID 1195
finish l'ID 1196
finish l'ID 1197
finish l'ID 1198
finish l'ID 1199
finish l'ID 1200
last_errors:
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200
Erreur lors de l'appel à l'API pour le fond avec l'ID 1200

--- PM2 api-monolith metadata ---
│ status            │ online                                                                     │
│ restarts          │ 169                                                                        │
│ uptime            │ 2D                                                                         │
│ script path       │ /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/app.js │
│ error log path    │ /root/.pm2/logs/api-monolith-error.log                                     │
│ out log path      │ /root/.pm2/logs/api-monolith-out.log                                       │
│ pid path          │ /root/.pm2/pids/api-monolith-0.pid                                         │
│ node.js version   │ 18.20.8                                                                    │
│ unstable restarts │ 0                                                                          │

--- PM2 logs: batch/perf/classement markers around Sep 14 ---
LOGFILE=/root/.pm2/logs/api-monolith-out.log
size=46484520 mtime=2026-09-15 00:00:19.452105966 +0000
::ffff:127.0.0.1 - - [18/Aug/2026:20:49:08 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [18/Aug/2026:20:54:08 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [18/Aug/2026:21:56:27 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [18/Aug/2026:22:01:19 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:03:26 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:03:26 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:03:27 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:08:27 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:13:27 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:18:27 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:21:35:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:21:40:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:04:23 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 44 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:09:23 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:14:23 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:45:05 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:50:05 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:55:05 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:21:57:17 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:22:02:15 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:04:25 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 44 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:09:27 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:14:25 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:43:27 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:48:27 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:53:27 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:21:56:24 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:22:01:20 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [22/Aug/2026:21:55:36 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [22/Aug/2026:22:00:07 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [23/Aug/2026:21:56:53 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [23/Aug/2026:22:01:53 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:10:03:37 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:10:08:37 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:02:07 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:02:07 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:02:08 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:07:08 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:12:08 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:17:08 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:21:35:02 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:21:40:02 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:05:05 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:10:05 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:15:05 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:44:52 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:49:52 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:54:52 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:21:56:50 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:22:01:50 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:04:43 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:09:44 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:14:45 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:45:14 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:50:14 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:55:14 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:21:57:21 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:22:02:21 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:03:12 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:03:12 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:03:13 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:08:13 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:13:13 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:18:13 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:21:35:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:21:40:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:04:33 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:09:34 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:14:35 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:45:00 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:50:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:55:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:21:58:05 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:22:03:05 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [29/Aug/2026:21:56:27 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [29/Aug/2026:22:01:27 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [30/Aug/2026:21:56:53 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [30/Aug/2026:22:01:46 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:10:03:57 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:10:08:57 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:20:04:54 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:20:09:54 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:20:14:54 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:20:55:34 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:21:03:33 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:21:09:39 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:21:57:29 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:22:02:29 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:20:04:21 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:20:09:21 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:20:14:21 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:20:55:16 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:21:03:19 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:21:09:09 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:21:56:54 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:22:01:54 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:20:02:23 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:20:02:23 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:20:02:24 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:20:32:24 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:21:02:24 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:21:32:24 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:21:35:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:21:40:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:20:04:22 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:20:09:22 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:20:14:23 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:20:55:19 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:21:03:17 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:21:09:27 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:21:56:53 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:22:01:53 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:20:04:33 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:20:09:33 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:20:14:33 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:20:56:29 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:21:05:58 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:21:12:58 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:22:03:23 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:22:08:23 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [05/Sep/2026:22:00:38 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [05/Sep/2026:22:05:38 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [06/Sep/2026:21:59:39 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [06/Sep/2026:22:04:39 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:10:03:50 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:10:08:50 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:20:05:59 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:20:10:59 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:20:16:00 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:21:03:40 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:21:10:22 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:21:18:57 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:22:04:40 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:22:09:40 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:02:45 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:02:45 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:02:46 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:32:46 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:21:02:46 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:21:32:46 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:21:35:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:21:40:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:20:04:43 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:20:09:44 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:20:14:45 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:21:00:52 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:21:08:47 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:21:17:05 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:22:02:20 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:22:07:20 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:20:04:53 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:20:09:53 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:20:14:53 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:21:01:38 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:21:08:42 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:21:17:42 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:22:03:14 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:22:08:14 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:20:04:51 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:20:09:51 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:20:14:51 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:20:59:40 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:21:08:39 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:21:15:36 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:22:01:42 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:22:06:43 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [12/Sep/2026:21:58:55 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [12/Sep/2026:22:03:55 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [13/Sep/2026:22:00:06 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [13/Sep/2026:22:05:05 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:10:04:14 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:10:04:15 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:20:04:44 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:20:09:44 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:20:14:44 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:20:58:42 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:21:06:42 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:21:13:15 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:22:01:31 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:22:06:31 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
LOGFILE=/root/.pm2/logs/api-monolith-error.log
size=2610128753 mtime=2026-09-14 22:04:43.288709046 +0000
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Une erreur s'est produite : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Une erreur s'est produite : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Une erreur s'est produite : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Une erreur s'est produite : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Une erreur s'est produite : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur saveperfdateeur: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur saveperfdateeur: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur saveperfdateusd: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur saveperfdateusd: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
[getPays] error: connect ECONNREFUSED 127.0.0.1:3306
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la requête SQL : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur listeopcvm: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
getfondbypays error: connect ECONNREFUSED 127.0.0.1:3306
Erreur lors de la récupération des données valLiq: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
LOGFILE=/root/.pm2/logs/api-monolith-out.log
size=46484520 mtime=2026-09-15 00:00:19.452105966 +0000
::ffff:127.0.0.1 - - [18/Aug/2026:20:49:08 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [18/Aug/2026:20:54:08 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [18/Aug/2026:21:56:27 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [18/Aug/2026:22:01:19 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:03:26 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:03:26 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:03:27 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:08:27 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:13:27 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:20:18:27 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:21:35:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [19/Aug/2026:21:40:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:04:23 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 44 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:09:23 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:14:23 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:45:05 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:50:05 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:20:55:05 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:21:57:17 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [20/Aug/2026:22:02:15 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:04:25 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 44 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:09:27 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:14:25 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:43:27 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:48:27 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:20:53:27 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:21:56:24 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [21/Aug/2026:22:01:20 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [22/Aug/2026:21:55:36 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [22/Aug/2026:22:00:07 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [23/Aug/2026:21:56:53 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [23/Aug/2026:22:01:53 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:10:03:37 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:10:08:37 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:02:07 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:02:07 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:02:08 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:07:08 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:12:08 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:20:17:08 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:21:35:02 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [24/Aug/2026:21:40:02 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:05:05 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:10:05 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:15:05 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:44:52 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:49:52 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:20:54:52 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:21:56:50 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [25/Aug/2026:22:01:50 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:04:43 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:09:44 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:14:45 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:45:14 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:50:14 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:20:55:14 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:21:57:21 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [26/Aug/2026:22:02:21 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:03:12 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:03:12 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:03:13 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:08:13 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:13:13 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:20:18:13 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:21:35:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:21:40:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:04:33 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:09:34 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:14:35 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:45:00 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:50:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:20:55:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:21:58:05 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [28/Aug/2026:22:03:05 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [29/Aug/2026:21:56:27 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [29/Aug/2026:22:01:27 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [30/Aug/2026:21:56:53 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [30/Aug/2026:22:01:46 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:10:03:57 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:10:08:57 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:20:04:54 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:20:09:54 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:20:14:54 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:20:55:34 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:21:03:33 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:21:09:39 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:21:57:29 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [31/Aug/2026:22:02:29 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:20:04:21 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:20:09:21 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:20:14:21 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:20:55:16 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:21:03:19 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:21:09:09 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:21:56:54 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [01/Sep/2026:22:01:54 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:20:02:23 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:20:02:23 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:20:02:24 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:20:32:24 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:21:02:24 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:21:32:24 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:21:35:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [02/Sep/2026:21:40:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:20:04:22 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:20:09:22 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:20:14:23 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:20:55:19 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:21:03:17 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:21:09:27 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:21:56:53 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [03/Sep/2026:22:01:53 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:20:04:33 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:20:09:33 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:20:14:33 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:20:56:29 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:21:05:58 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:21:12:58 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:22:03:23 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [04/Sep/2026:22:08:23 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [05/Sep/2026:22:00:38 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [05/Sep/2026:22:05:38 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [06/Sep/2026:21:59:39 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [06/Sep/2026:22:04:39 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:10:03:50 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:10:08:50 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:20:05:59 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:20:10:59 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:20:16:00 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:21:03:40 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:21:10:22 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:21:18:57 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:22:04:40 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [07/Sep/2026:22:09:40 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:02:45 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:02:45 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:02:46 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:32:46 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:21:02:46 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:21:32:46 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:21:35:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:21:40:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:20:04:43 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:20:09:44 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:20:14:45 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:21:00:52 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:21:08:47 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:21:17:05 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:22:02:20 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [09/Sep/2026:22:07:20 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:20:04:53 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:20:09:53 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:20:14:53 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:21:01:38 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:21:08:42 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:21:17:42 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:22:03:14 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [10/Sep/2026:22:08:14 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:20:04:51 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:20:09:51 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:20:14:51 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:20:59:40 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:21:08:39 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:21:15:36 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:22:01:42 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [11/Sep/2026:22:06:43 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [12/Sep/2026:21:58:55 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [12/Sep/2026:22:03:55 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [13/Sep/2026:22:00:06 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [13/Sep/2026:22:05:05 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:10:04:14 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:10:04:15 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:20:04:44 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 200 104 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:20:09:44 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:20:14:44 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:20:58:42 +0000] "GET /api/classementmysql HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:21:06:42 +0000] "GET /api/classementeur HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:21:13:15 +0000] "GET /api/classementusd HTTP/1.1" 200 12 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:22:01:31 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:22:06:31 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
LOGFILE=/root/.pm2/logs/api-monolith-error.log
size=2610128753 mtime=2026-09-14 22:04:43.288709046 +0000
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Une erreur s'est produite : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Une erreur s'est produite : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Une erreur s'est produite : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
ClickHouse not available, analytics features disabled: connect ECONNREFUSED ::1:8123
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Une erreur s'est produite : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Une erreur s'est produite : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur saveperfdateeur: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur saveperfdateeur: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur saveperfdateusd: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la récupération des fonds par catégorie : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur saveperfdateusd: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
[getPays] error: connect ECONNREFUSED 127.0.0.1:3306
Error: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur lors de la requête SQL : ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
Erreur listeopcvm: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
getfondbypays error: connect ECONNREFUSED 127.0.0.1:3306
Erreur lors de la récupération des données valLiq: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
  parent: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',
  original: Error: connect ECONNREFUSED 127.0.0.1:3306
    code: 'ECONNREFUSED',

--- processus node/mysql encore vivants ---
 928517  928318 Fri Sep  4 06:38:13 2026 10-17:44:48 node server.js
 928551  928371 Fri Sep  4 06:38:13 2026 10-17:44:48 node --import tsx/esm server.ts
 929244  928551 Fri Sep  4 06:38:16 2026 10-17:44:45 /app/node_modules/tsx/node_modules/@esbuild/linux-x64/bin/esbuild --service=0.27.3 --ping
 929356  928501 Fri Sep  4 06:38:17 2026 10-17:44:44 [node] <defunct>
2100513       1 Mon Sep 14 23:32:31 2026       50:30 /usr/sbin/mariadbd
3269585    4648 Sat Sep 12 02:12:41 2026  2-22:10:20 node /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/src/workers/wo
3269605    4648 Sat Sep 12 02:12:43 2026  2-22:10:18 node /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/src/workers/wo
3273968    4648 Sat Sep 12 02:20:38 2026  2-22:02:23 node /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/app.js
3351988 3351963 Sat Sep 12 05:00:07 2026  2-19:22:54 node --import tsx/esm server.ts
3352121 3351988 Sat Sep 12 05:00:07 2026  2-19:22:54 /app/node_modules/tsx/node_modules/@esbuild/linux-x64/bin/esbuild --service=0.27.3 --ping
2117834 2117459 Tue Sep 15 00:00:52 2026       22:09 Passenger NodeApp: /var/www/vhosts/chainsolutions.fr/Funds.chainsolutions.fr/f
2121710 2117459 Tue Sep 15 00:09:16 2026       13:45 Passenger NodeApp: /var/www/vhosts/chainsolutions.fr/stablecoin.chainsolutions
2121903 2117459 Tue Sep 15 00:09:21 2026       13:40 Passenger NodeApp: /var/www/vhosts/chainsolutions.fr/api.stablecoin.chainsolut
2130437 2117459 Tue Sep 15 00:20:03 2026       02:58 Passenger NodeApp: /var/www/vhosts/fantokenafrica.club/lysfc.fantokenafrica.cl

==============================================
 FIN — aucune variable modifiee, aucun service redemarre
==============================================
Traceback (most recent call last):
  File "<string>", line 1, in <module>
  File "/usr/lib/python3.10/json/__init__.py", line 346, in loads
    return _default_decoder.decode(s)
  File "/usr/lib/python3.10/json/decoder.py", line 337, in decode
    obj, end = self.raw_decode(s, idx=_w(s, 0).end())
  File "/usr/lib/python3.10/json/decoder.py", line 355, in raw_decode
    raise JSONDecodeError("Expecting value", s, err.value) from None
json.decoder.JSONDecodeError: Expecting value: line 2 column 1 (char 1)
```
