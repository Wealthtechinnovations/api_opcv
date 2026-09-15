# Memoire MySQL — releve

> Genere par `ops-mysql-memoire.yml`. Lecture seule. Ne pas modifier a la main.

Derniere execution : **2026-09-15 00:31 UTC**
Declencheur : `push` — par `Wealthtechinnovations`

```
==============================================
 1. MEMOIRE DE LA MACHINE
==============================================
               total        used        free      shared  buff/cache   available
Mem:           17945        2794         190         209       14960       14590
Swap:           2047         412        1635

RSS actuel de mariadbd :
  0.23 Go — demarre depuis 57:03

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
Connections	836
Created_tmp_disk_tables	5267
Created_tmp_files	4
Created_tmp_tables	6042
Max_used_connections	15
Memory_used	472949936
Memory_used_initial	442210192
Open_files	94
Open_table_definitions	400
Open_tables	619
Opened_files	22135
Opened_table_definitions	692
Opened_tables	626
Threads_connected	9
Threads_created	15
Threads_running	1
Uptime	3422

--- version / instrumentation ---
10.6.23-MariaDB-0ubuntu0.22.04.1	Ubuntu 22.04
aria_pagecache_buffer_size	134217728
performance_schema	OFF
table_definition_cache	400
version_malloc_library	system
MARIADB_PID=2100513
--- /proc status ---
2100513 246660 2792664     57:03   24  1.3 /usr/sbin/mariadbd
VmPeak:	 2923768 kB
VmSize:	 2792664 kB
VmRSS:	  246660 kB
RssAnon:	  224684 kB
RssFile:	   21976 kB
RssShmem:	       0 kB
VmData:	  612452 kB
VmSwap:	       0 kB
Threads:	24
--- smaps_rollup ---
Rss:              249340 kB
Pss:              243031 kB
Pss_Anon:         227028 kB
Pss_File:          16003 kB
Private_Clean:     15432 kB
Private_Dirty:    227028 kB
Anonymous:        227028 kB
AnonHugePages:         0 kB
Swap:                  0 kB
--- pmap totals ---
---------------- ------- ------- ------- 
total kB         2792668  249340  227028
--- allocator libraries ---
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f6a1a198000)
--- systemd/cgroup memory ---
Restart=on-abort
Result=success
NRestarts=0
OOMPolicy=stop
MemoryCurrent=258449408
ActiveState=active
SubState=running
[memory.current]
258449408
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
00007f3618000000    1796     836     836 rw---   [ anon ]
00007f3608000000    4072    1056    1056 rw---   [ anon ]
000055ac6c616000    1352    1352    1352 r---- mariadbd
00007f3684172000    2364    2104    2104 rw---   [ anon ]
00007f363c000000    6640    2404    2404 rw---   [ anon ]
00007f3660000000    5352    2464    2464 rw---   [ anon ]
00007f3698054000    4100    4100    4100 rw---   [ anon ]
00007f361c000000    6124    4188    4188 rw---   [ anon ]
000055ac76043000    5884    5080    5080 rw---   [ anon ]
00007f3620000000    6164    5240    5240 rw---   [ anon ]
00007f3698456000   16544    6424    6424 rw---   [ anon ]
00007f3648000000    7336    7092    7092 rw---   [ anon ]
00007f3654000000   10444    7588    7588 rw---   [ anon ]
000055ac6c831000    9060    8712    8712 rw---   [ anon ]
00007f3664000000   10100    9172    9172 rw---   [ anon ]
00007f3644000000   23316   10808   10808 rw---   [ anon ]
00007f3684577000  256548   24740   24740 rw---   [ anon ]
00007f36757ff000  163840  119104  119104 rw---   [ anon ]

--- top connexions par memoire ---
839	fund_opcvm	localhost	Query	0	0.15	0.15
209	fund_opcvm	localhost:60356	Sleep	1758	0.09	0.09
206	fund_opcvm	localhost:60334	Sleep	1756	0.09	0.33
205	fund_opcvm	localhost:60332	Sleep	1755	0.09	0.33
204	fund_opcvm	localhost:60324	Sleep	1756	0.09	0.32
46	fund_opcvm	localhost:40916	Sleep	1755	0.09	3.34
7	fund_opcvm	localhost:48340	Sleep	9	0.09	0.12
55	fund_opcvm	localhost:57702	Sleep	9	0.08	0.11

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
SAMPLE ts=2026-09-15T00:29:36Z rss_kb=246660 rssanon_kb=224684 swap_kb=0 mariadb_memory_used_bytes=471900792 connections=9
SAMPLE ts=2026-09-15T00:29:51Z rss_kb=246660 rssanon_kb=224684 swap_kb=0 mariadb_memory_used_bytes=471900776 connections=9
SAMPLE ts=2026-09-15T00:30:06Z rss_kb=246660 rssanon_kb=224684 swap_kb=0 mariadb_memory_used_bytes=471900776 connections=9
SAMPLE ts=2026-09-15T00:30:21Z rss_kb=246660 rssanon_kb=224684 swap_kb=0 mariadb_memory_used_bytes=471900776 connections=9
SAMPLE ts=2026-09-15T00:30:36Z rss_kb=246660 rssanon_kb=224684 swap_kb=0 mariadb_memory_used_bytes=471900640 connections=9
SAMPLE ts=2026-09-15T00:30:52Z rss_kb=246660 rssanon_kb=224684 swap_kb=0 mariadb_memory_used_bytes=471900776 connections=9

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

--- journal cron 09:55-10:10 UTC — OOM du 2026-09-14 ---
2026-09-14T09:55:01+0000 priceless-mayer CRON[837836]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T09:55:01+0000 priceless-mayer CRON[837835]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T09:55:01+0000 priceless-mayer CRON[837838]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T09:55:01+0000 priceless-mayer CRON[837837]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T09:56:01+0000 priceless-mayer CRON[838236]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T09:56:01+0000 priceless-mayer CRON[838237]: (root) CMD ([ -x /opt/psa/admin/sbin/backupmng ] && /opt/psa/admin/sbin/backupmng >/dev/null 2>&1)
2026-09-14T09:56:01+0000 priceless-mayer CRON[838238]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T09:57:01+0000 priceless-mayer CRON[838653]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T09:57:01+0000 priceless-mayer CRON[838654]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T09:57:01+0000 priceless-mayer CRON[838655]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/sslit/scripts/keep-secured.php')
2026-09-14T09:58:01+0000 priceless-mayer CRON[839073]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T09:58:01+0000 priceless-mayer CRON[839074]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T09:59:01+0000 priceless-mayer CRON[839483]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T09:59:01+0000 priceless-mayer CRON[839484]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T09:59:01+0000 priceless-mayer CRON[839485]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')
2026-09-14T10:00:01+0000 priceless-mayer CRON[839888]: (root) CMD (   bash -c 'sleep $((RANDOM % 1800))' ;imunify-antivirus imunify-patch subscriptions refresh > /dev/null 2>&1)
2026-09-14T10:00:01+0000 priceless-mayer CRON[839887]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T10:00:01+0000 priceless-mayer CRON[839889]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T10:00:01+0000 priceless-mayer CRON[839891]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T10:00:01+0000 priceless-mayer CRON[839893]: (root) CMD (cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/deploy/sync_production.sh >> /var/log/sync_production.log 2>&1)
2026-09-14T10:00:01+0000 priceless-mayer CRON[839906]: (root) CMD (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_nigeria_weekly.sh >> /var/log/africafunds_nigeria.log 2>&1)
2026-09-14T10:00:01+0000 priceless-mayer CRON[839905]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')
2026-09-14T10:00:01+0000 priceless-mayer CRON[839914]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T10:01:01+0000 priceless-mayer CRON[840409]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T10:01:01+0000 priceless-mayer CRON[840410]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T10:02:01+0000 priceless-mayer CRON[840813]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/wp-toolkit/scripts/maintenance.php')
2026-09-14T10:02:01+0000 priceless-mayer CRON[840815]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T10:05:01+0000 priceless-mayer CRON[843008]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T10:05:01+0000 priceless-mayer CRON[843009]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T10:05:01+0000 priceless-mayer CRON[843010]: (root) CMD (/usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1)
2026-09-14T10:05:01+0000 priceless-mayer CRON[843022]: (root) CMD (   bash -c 'sleep $((RANDOM % 60))' ; /opt/imunify360/venv/share/imunify360/scripts/check-detached.py > /dev/null 2>&1 || :)
2026-09-14T10:06:01+0000 priceless-mayer CRON[844972]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T10:06:01+0000 priceless-mayer CRON[844973]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T10:07:01+0000 priceless-mayer CRON[845373]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T10:07:01+0000 priceless-mayer CRON[845374]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T10:08:01+0000 priceless-mayer CRON[845774]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T10:08:01+0000 priceless-mayer CRON[845775]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T10:09:01+0000 priceless-mayer CRON[846206]: (root) CMD (/usr/libexec/imunify-notifier/timed-trigger)
2026-09-14T10:09:01+0000 priceless-mayer CRON[846207]: (root) CMD (  [ -x /usr/lib/php/sessionclean ] && if [ ! -d /run/systemd/system ]; then /usr/lib/php/sessionclean; fi)
2026-09-14T10:09:01+0000 priceless-mayer CRON[846208]: (root) CMD (/usr/sbin/imunify-notifier -update-cron)
2026-09-14T10:09:01+0000 priceless-mayer CRON[846209]: (psaadm) CMD (/opt/psa/admin/bin/php -dauto_prepend_file=sdk.php '/opt/psa/admin/plib/modules/monitoring/scripts/cloud-alerts.php')

--- Nigeria lundi 10h — execution du 2026-09-14 ---
FILE=/var/log/africafunds_nigeria_20260914.log size=17436 mtime=2026-09-14 10:04:17.504632568 +0000
========================================
=== AFRICAFUNDS NIGERIA WEEKLY UPDATE ===
=== Mon Sep 14 10:00:01 AM UTC 2026 ===
========================================

[1/8] Extraction SEC Nigeria (2026)...
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_10th_April_2026.xlsx | rows=222 | dates=2026-04-10
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_10th_July_2026.xlsx | rows=223 | dates=2026-07-10
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_11th_June_2026.xlsx | rows=222 | dates=2026-06-11
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_13th_February_2026.xlsx | rows=216 | dates=2026-02-13
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_13th_March_2026.xlsx | rows=219 | dates=2026-03-13
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_15th_May_2026.xlsx | rows=221 | dates=2026-05-15
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_16th_January_2026.xlsx | rows=214 | dates=2026-01-16
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_17th_April_2026.xlsx | rows=221 | dates=2026-04-17
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_17th_July_2026.xlsx | rows=225 | dates=2026-07-17
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_18th_March_2026.xlsx | rows=219 | dates=2026-03-18
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_19th_June_2026.xlsx | rows=222 | dates=2026-06-19
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_20th_February_2026.xlsx | rows=216 | dates=2026-02-20
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_21st_August_2026.xlsx | rows=227 | dates=2026-08-21
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_22nd_May_2026.xlsx | rows=221 | dates=2026-05-22
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_23rd_January_2026.xlsx | rows=214 | dates=2026-01-23
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_24th_April_2026.xlsx | rows=221 | dates=2026-04-24
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_24th_July_2026.xlsx | rows=225 | dates=2026-07-24
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_26th_June_2026.xlsx | rows=222 | dates=2026-06-26
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_27th_February_2026.xlsx | rows=217 | dates=2026-02-27
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_27th_March_2026.xlsx | rows=219 | dates=2026-03-27
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_28th_August_2026.xlsx | rows=227 | dates=2026-08-28
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_29th_May_2026.xlsx | rows=221 | dates=2026-05-29
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_2nd_April_2026.xlsx | rows=220 | dates=2026-04-02
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_2nd_January_2026.xlsx | rows=214 | dates=2026-01-02
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_30th_April_2026.xlsx | rows=222 | dates=2026-04-30
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_30th_January_2026.xlsx | rows=214 | dates=2026-01-30
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_31st_July_2026.xlsx | rows=225 | dates=2026-07-31
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_3rd_July_2026.xlsx | rows=222 | dates=2026-07-03
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_5th_June_2026.xlsx | rows=222 | dates=2026-06-05
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_6th_February_2026.xlsx | rows=215 | dates=2026-02-06
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_6th_March_2026.xlsx | rows=217 | dates=2026-03-06
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_7th_August_2026.xlsx | rows=227 | dates=2026-08-07
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_8th_May_2026.xlsx | rows=221 | dates=2026-05-08
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_9th_January_2026.xlsx | rows=214 | dates=2026-01-09

Extraction terminée.
Lignes extraites avant filtre qualité : 7487
Lignes écrites : 7487
Fichiers / feuilles audités : 34
Lignes de cohérence inter-fichiers : 0
Lignes de couverture annuelle : 1
Suggestions fuzzy naming : 2
CSV données : sec_ng_latest.csv
CSV audit : sec_ng_audit_latest.csv
CSV cohérence : sec_ng_coherence_latest.csv
CSV couverture annuelle : sec_ng_coverage_latest.csv
CSV fuzzy names : sec_ng_fuzzy_latest.csv
[1/8] OK

[2/8] Import VL Nigeria dans MySQL...
Lecture de sec_ng_latest.csv...
7487 lignes lues depuis le CSV
7430 lignes valides (avec date + prix + nom)
  57 lignes rejetees (VL hors bornes [0.0001-1000000] ou NAV > 5000000000000)
252 fonds distincts identifies
Connecte a la base fund_opcvm
Chargement des taux de change...
  132440 entrees forex chargees
  321 fonds normalises: pays -> 'Nigeria'
331 fonds Nigeria existants en base
  Progression: 20/252 fonds (0 VL inserees)...
  Progression: 40/252 fonds (0 VL inserees)...
  Progression: 60/252 fonds (0 VL inserees)...
  Progression: 80/252 fonds (0 VL inserees)...
  Progression: 100/252 fonds (0 VL inserees)...
  Progression: 120/252 fonds (4 VL inserees)...
  Progression: 140/252 fonds (20 VL inserees)...
  Progression: 160/252 fonds (24 VL inserees)...
  Progression: 180/252 fonds (24 VL inserees)...
  Progression: 200/252 fonds (24 VL inserees)...
  Progression: 220/252 fonds (24 VL inserees)...
  Progression: 240/252 fonds (37 VL inserees)...


==========================================
=== RAPPORT IMPORT VL NIGERIA (SEC) ===
==========================================
Fichier CSV:                   sec_ng_latest.csv
Lignes CSV totales:            7487
Lignes valides:                7430
Fonds dans le CSV:             252
Fonds matches (existants):     251
  dont fuzzy match:            2
Fonds crees (nouveaux):        1
Fonds ignores (--skip-existing): 0
Fonds metadata MAJ:            0
VL inserees:                   46
VL deja existantes (gardees):  6148
VL sans taux forex:            0
Erreurs:                       40

Contrat d ecriture:            mode warn, lot SECNG_20260914_100032
  Qualite des mesures:         CURRENCY_MISMATCH=1236  UNQUALIFIED=46
  Mesures refusees:            1236  <-- devise contredisant celle du fonds
  Rollback de ce lot:          DELETE FROM valorisations WHERE correction_batch = 'SECNG_20260914_100032'

Matches fuzzy (a verifier):
  CSV: "Nigeria Real Estate Investment Trust" <-> DB: "NIGERIAN REAL ESTATE INVESTMENT TRUST" (sim=0.954)
  CSV: "D'Namaz Halal Fixed Income Fund" <-> DB: "D NAMAZ HALAL FIXED INCOME FUND" (sim=0.963)

Premieres erreurs (max 20):
  - CONTRAT Afrinvest Equity Fund 2026-07-17 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1142 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Afrinvest Equity Fund 2026-08-21 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1142 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Afrinvest Equity Fund 2026-07-24 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1142 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Afrinvest Equity Fund 2026-08-28 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1142 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Afrinvest Equity Fund 2026-07-31 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1142 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Afrinvest Equity Fund 2026-08-07 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1142 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Anchoria Equity Fund 2026-07-17 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1148 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Anchoria Equity Fund 2026-08-21 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1148 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Anchoria Equity Fund 2026-07-24 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1148 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Anchoria Equity Fund 2026-08-28 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1148 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Anchoria Equity Fund 2026-07-31 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1148 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT Anchoria Equity Fund 2026-08-07 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1148 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT ARM Aggressive Growth Fund 2026-07-17 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1151 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT ARM Aggressive Growth Fund 2026-08-21 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1151 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT ARM Aggressive Growth Fund 2026-07-24 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1151 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT ARM Aggressive Growth Fund 2026-08-28 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1151 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT ARM Aggressive Growth Fund 2026-07-31 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1151 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT ARM Aggressive Growth Fund 2026-08-07 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1151 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT AXA Mansard Equity Income Fund 2026-07-17 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1161 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)
  - CONTRAT AXA Mansard Equity Income Fund 2026-08-21 : type de prix absent ; devise de la mesure (USD) differente de celle du fonds 1161 (NGN) — choisir la colonne publiee dans la devise du fonds, ne jamais convertir ; aucune provenance (ni URL ni identifiant de document)

Categories extraites:
  OBLIGATAIRE (59 fonds) => OBLIGATIONS / OBLIGATIONS
  MONETAIRE (48 fonds) => MONETAIRE / MONETAIRE
  AUTRE (43 fonds) => AUTRE / AUTRE
  DOLLAR (29 fonds) => DOLLAR / DOLLAR
  DIVERSIFIE (29 fonds) => DIVERSIFIE / DIVERSIFIE
  ACTIONS (22 fonds) => ACTIONS / ACTIONS
  ETF (11 fonds) => ETF / ETF
  IMMOBILIER (6 fonds) => IMMOBILIER / IMMOBILIER
  ETHIQUE (2 fonds) => ETHIQUE / ETHIQUE
  INFRASTRUCTURE (2 fonds) => INFRASTRUCTURE / INFRASTRUCTURE
  CHARIA (1 fonds) => CHARIA / CHARIA

VL par annee:
  2026: 7430 VL

Connexion fermee
[2/8] OK

[3/8] Recalcul EUR/USD taux quotidiens...
Connecte a la base fund_opcvm
Chargement de tous les taux de change...
  132440 entrees forex chargees
  Paires disponibles: EUR/USD, USD/MAD, EUR/XOF, USD/XOF, EUR/MAD, EUR/XAF, USD/XAF, EUR/ZAR, USD/EGP, EUR/KES, EUR/TND, USD/TND, USD/NGN, USD/KES, USD/ZAR, EUR/EGP, USD/NAD, EUR/NGN, EUR/NAD, EUR/GHS, USD/GHS
  EUR/USD: 7586 dates (2000-01-03 -> 2026-09-11)

1251 fonds a traiter

  [50/1251] MAD TWIN CASH: 1551 VL
  [100/1251] MAD PATRIMOINE OBLIGATIONS: 642 VL
  [150/1251] MAD FCP UPLINE CAPITAL GARANTI: 1848 VL
  [200/1251] MAD FCP EMERGENCE ALLOCATION: 331 VL
  [250/1251] MAD FCP CAP INSTITUTIONS: 1843 VL
  [300/1251] MAD ELAN SOLIDARITE: 390 VL
  [350/1251] MAD CFG CORPORATE BONDS: 405 VL
  [400/1251] MAD CAPITAL TRUST RENDEMENT: 390 VL
  [450/1251] MAD BMCI PREMIUM LONG TERM BOND: 409 VL
  [500/1251] MAD ATLAS OBLIGBANCAIRES: 1826 VL
  [550/1251] MAD AD BALANCED FUND: 396 VL
  [600/1251] NGN EDC DOLLAR FUND: 152 VL
  [650/1251] NGN NOVA DOLLAR FIXED INCOME FUND: 292 VL
  [700/1251] NGN ZENITH MONEY MARKET FUND: 440 VL
  [750/1251] TND INTERNATIONALE OBLIGATAIRE SICAV: 3138 VL
  [800/1251] TND SICAV PATRIMOINE OBLIGATAIRE: 3139 VL
  [850/1251] TND FCP AL IMTIEZ: 3114 VL
  [900/1251] XOF FCP CORIS PERFORMANCE: 417 VL
  [950/1251] XOF FCP ATLANTIQUE SECURITE: 218 VL
  [1000/1251] XAF FCP RAPEC: 61 VL
  [1050/1251] MAD TWIN LIQUID BANK: 121 VL
  [1100/1251] USD ZEDCREST DOLLAR FUND: 129 VL
  [1150/1251] USD FBN EUROBOND (NIGERIA EUROBOND USD) FUND (INSTITUTIONAL): 209 VL
  [1200/1251] USD ValuAlliance Specialized Dollar Fund: 18 VL
  [1250/1251] USD Alpha10 Halal Fund: 3 VL
  [1251/1251] USD First Asset Dollar Fund: 1 VL

==========================================
=== RAPPORT RECALCUL EUR/USD QUOTIDIEN ===
==========================================
Mode:                      REEL
Fonds traites:             1249
Fonds skipped:             2
VL recalculees:            989187 / 989187
Erreurs:                   0

VL par devise:
  MAD: 558882 VL
  TND: 307689 VL
  NGN: 75454 VL
  XOF: 43309 VL
  XAF: 2134 VL
  USD: 1719 VL

Echantillons avant/apres (MAD):
  AD HARMONIE DIVERSIFIE (2026-09-04):
    value=1115.27 MAD
    EUR: 102.5441 -> 102.5441
    USD: 118.9837 -> 118.9837
  WINEO OCT PLUS (2026-09-10):
    value=1075.45 MAD
    EUR: 99.0468 -> 99.0468
    USD: 114.8470 -> 114.8470
  WINEO DIVIDENDES ET CROISSANCE (2026-09-04):
    value=1368.99 MAD
    EUR: 125.8726 -> 125.8726
    USD: 146.0521 -> 146.0521

Verification (sur le perimetre traite) : le taux implicite
value / value_EUR correspond-il au taux reel du jour ?
  2026-09-10 MAD: 1075.45 / 99.0468 EUR = 10.8580 (reel: 10.8580) OK
  2026-09-10 MAD: 1363.05 / 125.5342 EUR = 10.8580 (reel: 10.8580) OK
  2026-09-10 MAD: 2023.05 / 186.3188 EUR = 10.8580 (reel: 10.8580) OK
  2026-09-10 MAD: 1550.84 / 142.8293 EUR = 10.8580 (reel: 10.8580) OK
  2026-09-10 MAD: 154.79 / 14.2558 EUR = 10.8580 (reel: 10.8580) OK

Termine.
[3/8] OK

[4/8] Recalcul VL Ajuste (tous fonds actifs)...
Connecte a la base fund_opcvm
1251 fonds a traiter

  [50/1251] TWIN CASH: 1551 VL
  [100/1251] PATRIMOINE OBLIGATIONS: 642 VL
  [150/1251] FCP UPLINE CAPITAL GARANTI: 1848 VL
  [200/1251] FCP EMERGENCE ALLOCATION: 331 VL
  [250/1251] FCP CAP INSTITUTIONS: 1843 VL
  [300/1251] ELAN SOLIDARITE: 390 VL
  [350/1251] CFG CORPORATE BONDS: 405 VL
  [400/1251] CAPITAL TRUST RENDEMENT: 390 VL
  [450/1251] BMCI PREMIUM LONG TERM BOND: 409 VL
  [500/1251] ATLAS OBLIGBANCAIRES: 1826 VL
  [550/1251] AD BALANCED FUND: 396 VL
  [600/1251] EDC DOLLAR FUND: 153 VL
  [650/1251] NOVA DOLLAR FIXED INCOME FUND: 292 VL
  [700/1251] ZENITH MONEY MARKET FUND: 440 VL
Erreur fatale: Error: Can't add new command when connection is in closed state
    at PromiseConnection.execute (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/node_modules/mysql2/promise.js:112:22)
    at run (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/recalc/recalc_vl_ajuste.js:88:33)
    at processTicksAndRejections (internal/process/task_queues.js:93:5) {
  code: undefined,
  errno: undefined,
  sql: undefined,
  sqlState: undefined,
  sqlMessage: undefined
}
[4/8] ERREUR (exit code 1)

[5a/8] Recalcul performances locale (fonds 1-600)...
{"error":"Une erreur s'est produite lors du traitement."}[5a/8] ERREUR (HTTP 500)

[5b/8] Recalcul performances locale (fonds 601-1200)...
{"error":"Une erreur s'est produite lors du traitement."}[5b/8] ERREUR (HTTP 500)

[6a/8] Recalcul performances EUR (fonds 1-600)...
{"error":"connect ECONNREFUSED 127.0.0.1:3306"}[6a/8] ERREUR (HTTP 500)

[6b/8] Recalcul performances EUR (fonds 601-1200)...
{"error":"connect ECONNREFUSED 127.0.0.1:3306"}[6b/8] ERREUR (HTTP 500)

[7a/8] Recalcul performances USD (fonds 1-600)...
{"error":"connect ECONNREFUSED 127.0.0.1:3306"}[7a/8] ERREUR (HTTP 500)

[7b/8] Recalcul performances USD (fonds 601-1200)...
{"error":"connect ECONNREFUSED 127.0.0.1:3306"}[7b/8] ERREUR (HTTP 500)

[8/8] Resynchronisation datejour (Nigeria)...
Erreur fatale : connect ECONNREFUSED 127.0.0.1:3306
[8/8] ERREUR (exit code 1)

=== NIGERIA WEEKLY UPDATE TERMINE AVEC 8 ERREUR(S) Mon Sep 14 10:04:17 AM UTC 2026 ===
========================================

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
size=46484885 mtime=2026-09-15 00:24:18.875600420 +0000
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
size=46484885 mtime=2026-09-15 00:24:18.875600420 +0000
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
 928517  928318 Fri Sep  4 06:38:13 2026 10-17:52:47 node server.js
 928551  928371 Fri Sep  4 06:38:13 2026 10-17:52:47 node --import tsx/esm server.ts
 929244  928551 Fri Sep  4 06:38:16 2026 10-17:52:44 /app/node_modules/tsx/node_modules/@esbuild/linux-x64/bin/esbuild --service=0.27.3 --ping
 929356  928501 Fri Sep  4 06:38:17 2026 10-17:52:43 [node] <defunct>
2100513       1 Mon Sep 14 23:32:31 2026       58:29 /usr/sbin/mariadbd
3269585    4648 Sat Sep 12 02:12:41 2026  2-22:18:19 node /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/src/workers/wo
3269605    4648 Sat Sep 12 02:12:43 2026  2-22:18:17 node /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/src/workers/wo
3273968    4648 Sat Sep 12 02:20:38 2026  2-22:10:22 node /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/app.js
3351988 3351963 Sat Sep 12 05:00:07 2026  2-19:30:53 node --import tsx/esm server.ts
3352121 3351988 Sat Sep 12 05:00:07 2026  2-19:30:53 /app/node_modules/tsx/node_modules/@esbuild/linux-x64/bin/esbuild --service=0.27.3 --ping
2117834 2117459 Tue Sep 15 00:00:52 2026       30:08 Passenger NodeApp: /var/www/vhosts/chainsolutions.fr/Funds.chainsolutions.fr/f
2121710 2117459 Tue Sep 15 00:09:16 2026       21:44 Passenger NodeApp: /var/www/vhosts/chainsolutions.fr/stablecoin.chainsolutions
2121903 2117459 Tue Sep 15 00:09:21 2026       21:39 Passenger NodeApp: /var/www/vhosts/chainsolutions.fr/api.stablecoin.chainsolut
2130437 2117459 Tue Sep 15 00:20:03 2026       10:57 Passenger NodeApp: /var/www/vhosts/fantokenafrica.club/lysfc.fantokenafrica.cl

==============================================
 8. CORRELATION MULTI-INCIDENTS — READ ONLY
==============================================
--- kernel OOM depuis 2026-08-17 (si journal encore disponible) ---
2026-09-14T10:04:11+0000 priceless-mayer kernel: npm start invoked oom-killer: gfp_mask=0x1100cca(GFP_HIGHUSER_MOVABLE), order=0, oom_score_adj=0
2026-09-14T10:04:12+0000 priceless-mayer kernel: oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=user.slice,mems_allowed=0,global_oom,task_memcg=/system.slice/mariadb.service,task=mariadbd,pid=1256690,uid=113
2026-09-14T10:04:12+0000 priceless-mayer kernel: Out of memory: Killed process 1256690 (mariadbd) total-vm:19512460kB, anon-rss:14902200kB, file-rss:0kB, shmem-rss:0kB, UID:113 pgtables:33628kB oom_score_adj:0

--- cron autour OOM 2026-08-27 21:40/22:00 ---
LOG=/var/log/africafunds_daily_20260827.log
========================================
=== AFRICAFUNDS DAILY UPDATE ===
=== Thu Aug 27 08:00:02 PM UTC 2026 ===
========================================
[1/9] Scrape ASFIM VL Maroc (2026-08-22 -> 2026-08-27)...
==========================================
=== RAPPORT SCRAPE & IMPORT ASFIM ===
==========================================
[1/9] OK
[2/9] Mise a jour Forex (derniers jours)...
    ECB EUR/TND: HTTP 404
    ECB EUR/NGN: HTTP 404
    ECB EUR/GHS: HTTP 404
    ECB EUR/KES: HTTP 404
    ECB EUR/EGP: HTTP 404
    ECB EUR/NAD: HTTP 404
==========================================
=== RAPPORT IMPORT FOREX ===
==========================================
[2/9] OK
[3/9] Recalcul EUR/USD daily rates...
1248 fonds a traiter
==========================================
=== RAPPORT RECALCUL EUR/USD QUOTIDIEN ===
==========================================
Fonds traites:             1246
[3/9] OK
[4/9] Recalcul VL Ajuste (tous fonds actifs)...
1248 fonds a traiter
[4/9] ERREUR (exit code 1)
[5/9] Recalcul performances locale (fonds 1-600)...
{"error":"Une erreur s'est produite lors du traitement."}[5/9] ERREUR (HTTP 500)
[6/9] Recalcul performances locale (fonds 601-1200)...
{"error":"Une erreur s'est produite lors du traitement."}[6/9] ERREUR (HTTP 500)
[7/9] Recalcul performances locale (fonds 1201-3000)...
{"error":"Une erreur s'est produite lors du traitement."}[7/9] ERREUR (HTTP 500)
[8/9] Recalcul performances EUR/USD...
ERREUR FATALE: Error: connect ECONNREFUSED 127.0.0.1:3306
[8/9] ERREUR (exit code 1)
[9a/9] Classement local...
[9a/9] ERREUR (HTTP 000)
[9b/9] Classement EUR...
[9b/9] ERREUR (HTTP 000)
[9c/9] Classement USD...
[9c/9] ERREUR (HTTP 000)
=== MISE A JOUR TERMINEE AVEC 8 ERREUR(S) Thu Aug 27 08:18:13 PM UTC 2026 ===
========================================

--- cron autour OOM 2026-08-31 18:33 ---
LOG=/var/log/africafunds_nigeria_20260831.log
========================================
=== AFRICAFUNDS NIGERIA WEEKLY UPDATE ===
=== Mon Aug 31 10:00:01 AM UTC 2026 ===
========================================
[1/8] Extraction SEC Nigeria (2026)...
[1/8] OK
[2/8] Import VL Nigeria dans MySQL...
==========================================
=== RAPPORT IMPORT VL NIGERIA (SEC) ===
==========================================
[2/8] OK
[3/8] Recalcul EUR/USD taux quotidiens...
1250 fonds a traiter
==========================================
=== RAPPORT RECALCUL EUR/USD QUOTIDIEN ===
==========================================
Fonds traites:             1248
[3/8] OK
[4/8] Recalcul VL Ajuste (tous fonds actifs)...
1250 fonds a traiter
==========================================
=== RAPPORT RECALCUL VL AJUSTE ===
==========================================
Fonds traites:             1249
[4/8] OK
[5a/8] Recalcul performances locale (fonds 1-600)...
{"message":"Performances locales: 25/25 fonds traites, 0 erreur(s)","total":25,"traites":25,"erreurs":0}[5a/8] OK (HTTP 200)
[5b/8] Recalcul performances locale (fonds 601-1200)...
[5b/8] ERREUR (HTTP 000)
[6a/8] Recalcul performances EUR (fonds 1-600)...
{"message":"EUR performances: 25/25 fonds traites, 0 erreur(s)","total":25,"traites":25,"erreurs":0}[6a/8] OK (HTTP 200)
[6b/8] Recalcul performances EUR (fonds 601-1200)...
{"message":"EUR performances: 586/586 fonds traites, 0 erreur(s)","total":586,"traites":586,"erreurs":0}[6b/8] OK (HTTP 200)
[7a/8] Recalcul performances USD (fonds 1-600)...
{"message":"USD performances: 25/25 fonds traites, 0 erreur(s)","total":25,"traites":25,"erreurs":0}[7a/8] OK (HTTP 200)
[7b/8] Recalcul performances USD (fonds 601-1200)...
{"message":"USD performances: 586/586 fonds traites, 0 erreur(s)","total":586,"traites":586,"erreurs":0}[7b/8] OK (HTTP 200)
[8/8] Resynchronisation datejour (Nigeria)...
=== SYNCHRONISATION datejour <- MAX(valorisations.date) ===
[8/8] OK
=== NIGERIA WEEKLY UPDATE TERMINE AVEC 1 ERREUR(S) Mon Aug 31 10:09:04 AM UTC 2026 ===
========================================

--- cron autour OOM 2026-09-08 20:02 ---
LOG=/var/log/africafunds_daily_20260908.log
========================================
=== AFRICAFUNDS DAILY UPDATE ===
=== Tue Sep  8 08:00:01 PM UTC 2026 ===
========================================

[1/9] Scrape ASFIM VL Maroc (2026-09-03 -> 2026-09-08)...
ASFIM Scrape & Import
Periode: 2026-09-03 -> 2026-09-08
API: https://fundshare.asfim.ma/api/performances/export/?date=YYYY-MM-DD

Connecte a la base fund_opcvm
Forex: EUR/MAD 7510 dates, USD/MAD 7615 dates
644 fonds MAROC existants (644 avec ISIN, 65 avec code)
Chargement des VL existantes...
557590 VL existantes

4 jours ouvrables a traiter


Mise a jour datejour + date_premiere_vl...

==========================================
=== RAPPORT SCRAPE & IMPORT ASFIM ===
==========================================
Dates scrapees:       4
Dates avec donnees:   3
Dates vides/feries:   1
Dates en erreur:      0
VL inserees:          323
VL deja existantes:   950
Fonds crees:          0
Fonds mis a jour:     627
Erreurs:              0

Verification finale MAROC:
  Total VL:  557913
  Fonds:     644
  Periode:   Fri Dec 29 2000 00:00:00 GMT+0000 (Coordinated Universal Time) -> Mon Sep 07 2026 00:00:00 GMT+0000 (Coordinated Universal Time)

Termine.
[1/9] OK

[2/9] Mise a jour Forex (derniers jours)...
Scrape Forex - depuis 2026-09-03

  Telechargement EUR/USD depuis FRED (St. Louis Fed)...
    FRED erreur: timeout
  Telechargement EUR/USD (EURUSD=X)...
    EUR/USD: 5 entrees
  Telechargement EUR/MAD (EURMAD=X)...
    EUR/MAD: 5 entrees
  Telechargement USD/MAD (USDMAD=X)...
    USD/MAD: 5 entrees
  Telechargement EUR/TND (EURTND=X)...
    EUR/TND: 5 entrees
  Telechargement USD/TND (USDTND=X)...
    USD/TND: 5 entrees
  Telechargement EUR/NGN (EURNGN=X)...
    EUR/NGN: 5 entrees
  Telechargement USD/NGN (USDNGN=X)...
    USD/NGN: 5 entrees
  Telechargement EUR/GHS (EURGHS=X)...
    EUR/GHS: 5 entrees
  Telechargement USD/GHS (USDGHS=X)...
    USD/GHS: 5 entrees
  Telechargement EUR/KES (EURKES=X)...
    EUR/KES: 5 entrees
  Telechargement USD/KES (USDKES=X)...
    USD/KES: 5 entrees
  Telechargement EUR/ZAR (EURZAR=X)...
    EUR/ZAR: 5 entrees
  Telechargement USD/ZAR (USDZAR=X)...
    USD/ZAR: 5 entrees
  Telechargement EUR/EGP (EUREGP=X)...
    EUR/EGP: 5 entrees
  Telechargement USD/EGP (USDEGP=X)...
    USD/EGP: 5 entrees
  Telechargement EUR/NAD (EURNAD=X)...
    EUR/NAD: 5 entrees
  Telechargement USD/NAD (USDNAD=X)...
    USD/NAD: 5 entrees

  ECB fallback pour paires EUR/* insuffisantes...
  EUR/TND: seulement 5 Yahoo — essai ECB...
    ECB fallback EUR/TND...
    ECB EUR/TND: erreur unable to get local issuer certificate
  EUR/NGN: seulement 5 Yahoo — essai ECB...
    ECB fallback EUR/NGN...
    ECB EUR/NGN: erreur unable to get local issuer certificate
  EUR/MAD: seulement 5 Yahoo — essai ECB...
    ECB fallback EUR/MAD...
    ECB EUR/MAD: erreur unable to get local issuer certificate
  EUR/GHS: seulement 5 Yahoo — essai ECB...
    ECB fallback EUR/GHS...
    ECB EUR/GHS: erreur unable to get local issuer certificate
  EUR/KES: seulement 5 Yahoo — essai ECB...
    ECB fallback EUR/KES...
    ECB EUR/KES: erreur unable to get local issuer certificate
  EUR/ZAR: seulement 5 Yahoo — essai ECB...
    ECB fallback EUR/ZAR...
    ECB EUR/ZAR: erreur unable to get local issuer certificate
  EUR/EGP: seulement 5 Yahoo — essai ECB...
    ECB fallback EUR/EGP...
    ECB EUR/EGP: erreur unable to get local issuer certificate
  EUR/NAD: seulement 5 Yahoo — essai ECB...
    ECB fallback EUR/NAD...
    ECB EUR/NAD: erreur unable to get local issuer certificate

  Cross-rate derivation USD/* depuis EUR/* et EUR/USD...

  Generation paires CFA (parite fixe 655.957, EUR/USD: 5 dates)...
    EUR/XOF: 4 entrees generees
    USD/XOF: 3 entrees generees
    EUR/XAF: 4 entrees generees
    USD/XAF: 3 entrees generees

Total: 21 paires collectees

Connecte a la base fund_opcvm
132353 entrees existantes

  EUR/USD   : 1 inseres, 4 existants
  EUR/MAD   : 1 inseres, 4 existants
  USD/MAD   : 1 inseres, 4 existants
  EUR/TND   : 1 inseres, 4 existants
  USD/TND   : 1 inseres, 4 existants
  EUR/NGN   : 1 inseres, 4 existants
  USD/NGN   : 1 inseres, 4 existants
  EUR/GHS   : 1 inseres, 4 existants
  USD/GHS   : 1 inseres, 4 existants
  EUR/KES   : 1 inseres, 4 existants
  USD/KES   : 1 inseres, 4 existants
  EUR/ZAR   : 1 inseres, 4 existants
  USD/ZAR   : 1 inseres, 4 existants
  EUR/EGP   : 1 inseres, 4 existants
  USD/EGP   : 1 inseres, 4 existants
  EUR/NAD   : 1 inseres, 4 existants
  USD/NAD   : 1 inseres, 4 existants
  EUR/XOF   : 1 inseres, 3 existants
  USD/XOF   : 1 inseres, 2 existants
  EUR/XAF   : 1 inseres, 3 existants
  USD/XAF   : 1 inseres, 2 existants

Correction des entrees value=0...
  Aucune correction necessaire


==========================================
=== RAPPORT IMPORT FOREX ===
==========================================
Total inseres:      21
Total existants:    78
Total corriges:     0

Etat devisedechanges:
  EUR/EGP   :   5931 entrees (Mon Dec 01 2003 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  EUR/GHS   :   4985 entrees (Sun Jul 01 2007 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  EUR/KES   :   6078 entrees (Thu Mar 14 2002 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  EUR/MAD   :   7514 entrees (Mon Jan 03 2000 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  EUR/NAD   :   5279 entrees (Mon May 15 2006 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  EUR/NGN   :   5279 entrees (Mon May 15 2006 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  EUR/TND   :   6046 entrees (Mon Dec 01 2003 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  EUR/USD   :   7583 entrees (Mon Jan 03 2000 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  EUR/XAF   :   6963 entrees (Mon Jan 03 2000 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  EUR/XOF   :   6963 entrees (Mon Jan 03 2000 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  EUR/ZAR   :   6893 entrees (Thu Mar 09 2000 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  USD/EGP   :   6353 entrees (Thu May 31 2001 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  USD/GHS   :   4993 entrees (Tue Jul 10 2007 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  USD/KES   :   5942 entrees (Mon Dec 01 2003 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  USD/MAD   :   7616 entrees (Mon Jan 03 2000 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  USD/NAD   :   5938 entrees (Mon Dec 01 2003 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  USD/NGN   :   5939 entrees (Mon Dec 01 2003 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  USD/TND   :   6369 entrees (Mon Dec 01 2003 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  USD/XAF   :   6892 entrees (Mon Jan 03 2000 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  USD/XOF   :   6881 entrees (Mon Jan 03 2000 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))
  USD/ZAR   :   5940 entrees (Mon Dec 01 2003 00:00:00 GMT+0000 (Coordinated Universal Time) -> Tue Sep 08 2026 00:00:00 GMT+0000 (Coordinated Universal Time))

Termine.
[2/9] OK

[3/9] Recalcul EUR/USD daily rates...
Connecte a la base fund_opcvm
Chargement de tous les taux de change...
  132377 entrees forex chargees
  Paires disponibles: EUR/USD, USD/MAD, EUR/XOF, USD/XOF, EUR/MAD, EUR/XAF, USD/XAF, EUR/ZAR, USD/EGP, EUR/KES, EUR/TND, USD/TND, USD/NGN, USD/KES, USD/ZAR, EUR/EGP, USD/NAD, EUR/NGN, EUR/NAD, EUR/GHS, USD/GHS
  EUR/USD: 7583 dates (2000-01-03 -> 2026-09-08)

1250 fonds a traiter

  [50/1250] MAD TWIN CASH: 1548 VL
  [100/1250] MAD PATRIMOINE OBLIGATIONS: 639 VL
  [150/1250] MAD FCP UPLINE CAPITAL GARANTI: 1845 VL
  [200/1250] MAD FCP EMERGENCE ALLOCATION: 331 VL
  [250/1250] MAD FCP CAP INSTITUTIONS: 1840 VL
  [300/1250] MAD ELAN SOLIDARITE: 390 VL
  [350/1250] MAD CFG CORPORATE BONDS: 405 VL
  [400/1250] MAD CAPITAL TRUST RENDEMENT: 390 VL
  [450/1250] MAD BMCI PREMIUM LONG TERM BOND: 409 VL
  [500/1250] MAD ATLAS OBLIGBANCAIRES: 1823 VL
  [550/1250] MAD AD BALANCED FUND: 396 VL
  [600/1250] NGN EDC DOLLAR FUND: 152 VL
Erreur fatale: Error: read ECONNRESET
    at PromiseConnection.execute (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/node_modules/mysql2/promise.js:112:22)
    at run (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/recalc/recalc_eur_usd_daily_rate.js:210:33)
    at runMicrotasks (<anonymous>)
    at processTicksAndRejections (internal/process/task_queues.js:93:5) {
  code: 'ECONNRESET',
  errno: -104,
  sql: undefined,
  sqlState: undefined,
  sqlMessage: undefined
}
[3/9] ERREUR (exit code 1)

[4/9] Recalcul VL Ajuste (tous fonds actifs)...
Erreur fatale: Error: connect ECONNREFUSED 127.0.0.1:3306
    at Object.createConnection (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/node_modules/mysql2/promise.js:253:31)
    at run (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/recalc/recalc_vl_ajuste.js:35:28)
    at Object.<anonymous> (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/recalc/recalc_vl_ajuste.js:222:1)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1092:10)
    at Module.load (internal/modules/cjs/loader.js:928:32)
    at Function.Module._load (internal/modules/cjs/loader.js:769:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:72:12)
    at internal/main/run_main_module.js:17:47 {
  code: 'ECONNREFUSED',
  errno: -111,
  sqlState: undefined
}
[4/9] ERREUR (exit code 1)

[5/9] Recalcul performances locale (fonds 1-600)...
{"error":"Une erreur s'est produite lors du traitement."}[5/9] ERREUR (HTTP 500)

[6/9] Recalcul performances locale (fonds 601-1200)...
{"error":"Une erreur s'est produite lors du traitement."}[6/9] ERREUR (HTTP 500)

[7/9] Recalcul performances locale (fonds 1201-3000)...
{"error":"Une erreur s'est produite lors du traitement."}[7/9] ERREUR (HTTP 500)

[8/9] Recalcul performances EUR/USD...
ERREUR FATALE: Error: connect ECONNREFUSED 127.0.0.1:3306
    at Object.createConnection (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/node_modules/mysql2/promise.js:253:31)
    at run (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/fix/fix_populate_performances_eur_usd.js:324:28)
    at Object.<anonymous> (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/fix/fix_populate_performances_eur_usd.js:369:1)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1092:10)
    at Module.load (internal/modules/cjs/loader.js:928:32)
    at Function.Module._load (internal/modules/cjs/loader.js:769:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:72:12)
    at internal/main/run_main_module.js:17:47 {
  code: 'ECONNREFUSED',
  errno: -111,
  sqlState: undefined
}
[8/9] ERREUR (exit code 1)

[9a/9] Classement local...
[9a/9] ERREUR (HTTP 000)

[9b/9] Classement EUR...
[9b/9] ERREUR (HTTP 000)

[9c/9] Classement USD...
[9c/9] ERREUR (HTTP 000)

=== MISE A JOUR TERMINEE AVEC 9 ERREUR(S) Tue Sep  8 09:32:46 PM UTC 2026 ===
========================================

--- PM2 access markers autour des occurrences ---
::ffff:127.0.0.1 - - [27/Aug/2026:21:35:01 +0000] "GET /api/classementeur HTTP/1.1" - - "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [27/Aug/2026:21:40:01 +0000] "GET /api/classementusd HTTP/1.1" - - "-" "curl/7.81.0"
217.160.249.254 - - [31/Aug/2026:18:00:13 +0000] "GET /api/ratiosnew/3/866 HTTP/1.1" 200 2165 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:00:13 +0000] "GET /api/ratiosnew/1/866 HTTP/1.1" 200 2249 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:00:13 +0000] "GET /api/ratiosnew/5/866 HTTP/1.1" 200 2216 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:00:13 +0000] "GET /api/performances/fond/866?date=2026-08-27 HTTP/1.1" 200 2893 "-" "node"
::ffff:127.0.0.1 - - [31/Aug/2026:18:00:13 +0000] "GET /api/valLiq/866 HTTP/1.1" 200 110451 "-" "-"
217.160.249.254 - - [31/Aug/2026:18:00:14 +0000] "GET /api/ratiosnew/1/1141 HTTP/1.1" 200 1851 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:00:14 +0000] "GET /api/ratiosnew/3/1141 HTTP/1.1" 200 1754 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:00:15 +0000] "GET /api/ratiosnew/5/1141 HTTP/1.1" 200 1808 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:00:15 +0000] "GET /api/performances/fond/1141?date=2026-07-10 HTTP/1.1" 200 2897 "-" "node"
::ffff:127.0.0.1 - - [31/Aug/2026:18:00:15 +0000] "GET /api/valLiq/1141 HTTP/1.1" 200 31250 "-" "-"
::ffff:127.0.0.1 - - [31/Aug/2026:18:00:15 +0000] "GET /api/getactualite HTTP/1.1" 200 2 "-" "-"
::ffff:127.0.0.1 - - [31/Aug/2026:18:00:15 +0000] "GET /api/getPaysall HTTP/1.1" 200 1598 "-" "-"
217.160.249.254 - - [31/Aug/2026:18:34:24 +0000] "GET /api/ratiosnew/1/1141 HTTP/1.1" 200 1841 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:34:24 +0000] "GET /api/ratiosnew/3/1141 HTTP/1.1" 200 1754 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:34:24 +0000] "GET /api/performances/fond/1141?date=2026-07-10 HTTP/1.1" 200 2897 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:34:24 +0000] "GET /api/ratiosnew/5/1141 HTTP/1.1" 200 1810 "-" "node"
160.79.106.130 - - [31/Aug/2026:18:34:24 +0000] "GET /api/valLiq/1141 HTTP/1.1" 200 31270 "-" "curl/8.5.0"
::ffff:127.0.0.1 - - [31/Aug/2026:18:34:31 +0000] "GET /api/getfondbypays/MAROC HTTP/1.1" 200 141152 "-" "curl/7.81.0"
217.160.249.254 - - [31/Aug/2026:18:39:26 +0000] "GET /api/ratiosnew/3/1141 HTTP/1.1" 200 1754 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:26 +0000] "GET /api/ratiosnew/1/1141 HTTP/1.1" 200 1841 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:26 +0000] "GET /api/ratiosnew/5/1141 HTTP/1.1" 200 1810 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:26 +0000] "GET /api/performances/fond/1141?date=2026-07-10 HTTP/1.1" 200 2897 "-" "node"
160.79.106.137 - - [31/Aug/2026:18:39:26 +0000] "GET /api/valLiq/1141 HTTP/1.1" 200 31270 "-" "curl/8.5.0"
217.160.249.254 - - [31/Aug/2026:18:39:27 +0000] "GET /api/ratiosnew/1/1168 HTTP/1.1" 200 1845 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:28 +0000] "GET /api/ratiosnew/3/1168 HTTP/1.1" 200 1768 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:28 +0000] "GET /api/ratiosnew/5/1168 HTTP/1.1" 200 24 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:28 +0000] "GET /api/performances/fond/1168?date=2026-07-10 HTTP/1.1" 200 2756 "-" "node"
160.79.106.131 - - [31/Aug/2026:18:39:28 +0000] "GET /api/valLiq/1168 HTTP/1.1" 200 24581 "-" "curl/8.5.0"
::ffff:127.0.0.1 - - [31/Aug/2026:18:39:30 +0000] "GET /api/getfondbypays/MAROC HTTP/1.1" 200 141152 "-" "curl/7.81.0"
217.160.249.254 - - [31/Aug/2026:18:39:32 +0000] "GET /api/ratiosnew/1/1141 HTTP/1.1" 200 1841 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:32 +0000] "GET /api/ratiosnew/3/1141 HTTP/1.1" 200 1754 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:32 +0000] "GET /api/performances/fond/1141?date=2026-07-10 HTTP/1.1" 200 2897 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:33 +0000] "GET /api/ratiosnew/5/1141 HTTP/1.1" 200 1810 "-" "node"
160.79.106.128 - - [31/Aug/2026:18:39:33 +0000] "GET /api/valLiq/1141 HTTP/1.1" 200 31270 "-" "curl/8.5.0"
217.160.249.254 - - [31/Aug/2026:18:39:34 +0000] "GET /api/ratiosnew/1/1141 HTTP/1.1" 200 1841 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:34 +0000] "GET /api/ratiosnew/3/1141 HTTP/1.1" 200 1754 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:34 +0000] "GET /api/performances/fond/1141?date=2026-07-10 HTTP/1.1" 200 2897 "-" "node"
217.160.249.254 - - [31/Aug/2026:18:39:34 +0000] "GET /api/ratiosnew/5/1141 HTTP/1.1" 200 1810 "-" "node"
160.79.106.133 - - [31/Aug/2026:18:39:34 +0000] "GET /api/valLiq/1141 HTTP/1.1" 200 31270 "-" "curl/8.5.0"
217.160.249.254 - - [08/Sep/2026:19:00:13 +0000] "GET /api/ratiosnew/1/866 HTTP/1.1" 200 2232 "-" "node"
217.160.249.254 - - [08/Sep/2026:19:00:13 +0000] "GET /api/ratiosnew/3/866 HTTP/1.1" 200 2173 "-" "node"
217.160.249.254 - - [08/Sep/2026:19:00:14 +0000] "GET /api/ratiosnew/5/866 HTTP/1.1" 200 2201 "-" "node"
217.160.249.254 - - [08/Sep/2026:19:00:14 +0000] "GET /api/performances/fond/866?date=2026-09-04 HTTP/1.1" 200 2900 "-" "node"
::ffff:127.0.0.1 - - [08/Sep/2026:19:00:14 +0000] "GET /api/valLiq/866 HTTP/1.1" 200 110633 "-" "-"
217.160.249.254 - - [08/Sep/2026:19:00:14 +0000] "GET /api/ratiosnew/3/1141 HTTP/1.1" 200 1754 "-" "node"
217.160.249.254 - - [08/Sep/2026:19:00:15 +0000] "GET /api/ratiosnew/1/1141 HTTP/1.1" 200 1841 "-" "node"
217.160.249.254 - - [08/Sep/2026:19:00:15 +0000] "GET /api/ratiosnew/5/1141 HTTP/1.1" 200 1809 "-" "node"
217.160.249.254 - - [08/Sep/2026:19:00:15 +0000] "GET /api/performances/fond/1141?date=2026-07-10 HTTP/1.1" 200 2897 "-" "node"
::ffff:127.0.0.1 - - [08/Sep/2026:19:00:15 +0000] "GET /api/valLiq/1141 HTTP/1.1" 200 31213 "-" "-"
::ffff:127.0.0.1 - - [08/Sep/2026:19:00:15 +0000] "GET /api/getactualite HTTP/1.1" 200 2 "-" "-"
::ffff:127.0.0.1 - - [08/Sep/2026:19:00:15 +0000] "GET /api/getPaysall HTTP/1.1" 200 1598 "-" "-"
217.160.249.254 - - [08/Sep/2026:20:00:12 +0000] "GET /api/ratiosnew/3/866 HTTP/1.1" 200 2173 "-" "node"
217.160.249.254 - - [08/Sep/2026:20:00:12 +0000] "GET /api/ratiosnew/1/866 HTTP/1.1" 200 2232 "-" "node"
217.160.249.254 - - [08/Sep/2026:20:00:13 +0000] "GET /api/ratiosnew/5/866 HTTP/1.1" 200 2201 "-" "node"
217.160.249.254 - - [08/Sep/2026:20:00:13 +0000] "GET /api/performances/fond/866?date=2026-09-04 HTTP/1.1" 200 2900 "-" "node"
::ffff:127.0.0.1 - - [08/Sep/2026:20:00:13 +0000] "GET /api/valLiq/866 HTTP/1.1" 200 110633 "-" "-"
217.160.249.254 - - [08/Sep/2026:20:00:13 +0000] "GET /api/ratiosnew/1/1141 HTTP/1.1" 200 1841 "-" "node"
217.160.249.254 - - [08/Sep/2026:20:00:14 +0000] "GET /api/ratiosnew/3/1141 HTTP/1.1" 200 1754 "-" "node"
217.160.249.254 - - [08/Sep/2026:20:00:14 +0000] "GET /api/ratiosnew/5/1141 HTTP/1.1" 200 1809 "-" "node"
217.160.249.254 - - [08/Sep/2026:20:00:14 +0000] "GET /api/performances/fond/1141?date=2026-07-10 HTTP/1.1" 200 2897 "-" "node"
::ffff:127.0.0.1 - - [08/Sep/2026:20:00:14 +0000] "GET /api/valLiq/1141 HTTP/1.1" 200 31213 "-" "-"
::ffff:127.0.0.1 - - [08/Sep/2026:20:00:14 +0000] "GET /api/getactualite HTTP/1.1" 200 2 "-" "-"
::ffff:127.0.0.1 - - [08/Sep/2026:20:00:14 +0000] "GET /api/getPaysall HTTP/1.1" 200 1598 "-" "-"
::ffff:127.0.0.1 - - [08/Sep/2026:20:02:45 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:02:45 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:02:46 +0000] "GET /api/saveperfdatemysql/1201/3000 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [08/Sep/2026:20:32:46 +0000] "GET /api/classementmysql HTTP/1.1" - - "-" "curl/7.81.0"
217.160.249.254 - - [14/Sep/2026:09:00:13 +0000] "GET /api/ratiosnew/3/866 HTTP/1.1" 200 2173 "-" "node"
217.160.249.254 - - [14/Sep/2026:09:00:14 +0000] "GET /api/ratiosnew/1/866 HTTP/1.1" 200 2232 "-" "node"
217.160.249.254 - - [14/Sep/2026:09:00:14 +0000] "GET /api/ratiosnew/5/866 HTTP/1.1" 200 2201 "-" "node"
217.160.249.254 - - [14/Sep/2026:09:00:14 +0000] "GET /api/performances/fond/866?date=2026-09-10 HTTP/1.1" 200 2893 "-" "node"
::ffff:127.0.0.1 - - [14/Sep/2026:09:00:14 +0000] "GET /api/valLiq/866 HTTP/1.1" 200 110604 "-" "-"
217.160.249.254 - - [14/Sep/2026:09:00:15 +0000] "GET /api/ratiosnew/1/1141 HTTP/1.1" 200 1841 "-" "node"
217.160.249.254 - - [14/Sep/2026:09:00:15 +0000] "GET /api/ratiosnew/3/1141 HTTP/1.1" 200 1754 "-" "node"
217.160.249.254 - - [14/Sep/2026:09:00:15 +0000] "GET /api/ratiosnew/5/1141 HTTP/1.1" 200 1809 "-" "node"
217.160.249.254 - - [14/Sep/2026:09:00:15 +0000] "GET /api/performances/fond/1141?date=2026-07-10 HTTP/1.1" 200 2897 "-" "node"
::ffff:127.0.0.1 - - [14/Sep/2026:09:00:15 +0000] "GET /api/valLiq/1141 HTTP/1.1" 200 31133 "-" "-"
::ffff:127.0.0.1 - - [14/Sep/2026:09:00:15 +0000] "GET /api/getactualite HTTP/1.1" 200 2 "-" "-"
::ffff:127.0.0.1 - - [14/Sep/2026:09:00:15 +0000] "GET /api/getPaysall HTTP/1.1" 200 1598 "-" "-"
217.160.249.254 - - [14/Sep/2026:10:00:14 +0000] "GET /api/ratiosnew/1/866 HTTP/1.1" 200 2232 "-" "node"
217.160.249.254 - - [14/Sep/2026:10:00:15 +0000] "GET /api/ratiosnew/3/866 HTTP/1.1" 200 2173 "-" "node"
217.160.249.254 - - [14/Sep/2026:10:00:15 +0000] "GET /api/ratiosnew/5/866 HTTP/1.1" 200 2201 "-" "node"
217.160.249.254 - - [14/Sep/2026:10:00:15 +0000] "GET /api/performances/fond/866?date=2026-09-10 HTTP/1.1" 200 2893 "-" "node"
::ffff:127.0.0.1 - - [14/Sep/2026:10:00:15 +0000] "GET /api/valLiq/866 HTTP/1.1" 200 110604 "-" "-"
217.160.249.254 - - [14/Sep/2026:10:00:16 +0000] "GET /api/ratiosnew/1/1141 HTTP/1.1" 200 1841 "-" "node"
217.160.249.254 - - [14/Sep/2026:10:00:16 +0000] "GET /api/ratiosnew/3/1141 HTTP/1.1" 200 1754 "-" "node"
217.160.249.254 - - [14/Sep/2026:10:00:16 +0000] "GET /api/ratiosnew/5/1141 HTTP/1.1" 200 1809 "-" "node"
217.160.249.254 - - [14/Sep/2026:10:00:16 +0000] "GET /api/performances/fond/1141?date=2026-07-10 HTTP/1.1" 200 2897 "-" "node"
::ffff:127.0.0.1 - - [14/Sep/2026:10:00:16 +0000] "GET /api/valLiq/1141 HTTP/1.1" 200 31133 "-" "-"
::ffff:127.0.0.1 - - [14/Sep/2026:10:00:16 +0000] "GET /api/getactualite HTTP/1.1" 200 2 "-" "-"
::ffff:127.0.0.1 - - [14/Sep/2026:10:00:16 +0000] "GET /api/getPaysall HTTP/1.1" 200 1598 "-" "-"
::ffff:127.0.0.1 - - [14/Sep/2026:10:04:14 +0000] "GET /api/saveperfdatemysql/1/600 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:10:04:15 +0000] "GET /api/saveperfdatemysql/601/1200 HTTP/1.1" 500 57 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:10:04:15 +0000] "GET /api/saveperfdateeur/1/600 HTTP/1.1" 500 47 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:10:04:16 +0000] "GET /api/saveperfdateeur/601/1200 HTTP/1.1" 500 47 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:10:04:16 +0000] "GET /api/saveperfdateusd/1/600 HTTP/1.1" 500 47 "-" "curl/7.81.0"
::ffff:127.0.0.1 - - [14/Sep/2026:10:04:17 +0000] "GET /api/saveperfdateusd/601/1200 HTTP/1.1" 500 47 "-" "curl/7.81.0"

==============================================
 FIN — aucune variable modifiee, aucun service redemarre
==============================================
```
