# Memoire MySQL — releve

> Genere par `ops-mysql-memoire.yml`. Lecture seule. Ne pas modifier a la main.

Derniere execution : **2026-09-14 22:53 UTC**
Declencheur : `push` — par `Wealthtechinnovations`

```
==============================================
 1. MEMOIRE DE LA MACHINE
==============================================
               total        used        free      shared  buff/cache   available
Mem:           17945        9444        4177         216        4323        7933
Swap:           2047         381        1666

RSS actuel de mariadbd :
  6.68 Go — demarre depuis 08:52:07

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
Max_used_connections	19
Threads_connected	9
Threads_running	1

==============================================
 2b. MEMORY_USED / PROC / ALLOCATEUR
==============================================
Aborted_connects	155
Connections	1907
Created_tmp_disk_tables	1912
Created_tmp_files	18
Created_tmp_tables	15594
Max_used_connections	19
Memory_used	465884576
Memory_used_initial	442210192
Open_files	81
Open_table_definitions	400
Open_tables	236
Opened_files	8608
Opened_table_definitions	607
Opened_tables	243
Threads_connected	9
Threads_created	26
Threads_running	1
Uptime	31926

--- version / instrumentation ---
10.6.23-MariaDB-0ubuntu0.22.04.1	Ubuntu 22.04
aria_pagecache_buffer_size	134217728
performance_schema	OFF
table_definition_cache	400
version_malloc_library	system
MARIADB_PID=1784030
--- /proc status ---
1784030 6999328 9738320 08:52:07   18 38.0 /usr/sbin/mariadbd
VmPeak:	 9937360 kB
VmSize:	 9738320 kB
VmRSS:	 6999328 kB
RssAnon:	 6974948 kB
RssFile:	   24380 kB
RssShmem:	       0 kB
VmData:	 7508292 kB
VmSwap:	       0 kB
Threads:	18
--- smaps_rollup ---
Rss:             7001164 kB
Pss:             6995331 kB
Pss_Anon:        6976696 kB
Pss_File:          18635 kB
Private_Clean:     17820 kB
Private_Dirty:   6976696 kB
Anonymous:       6976696 kB
AnonHugePages:         0 kB
Swap:                  0 kB
--- pmap totals ---
---------------- ------- ------- ------- 
total kB         9738324 7001164 6976696
--- allocator libraries ---
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007fe251649000)
--- systemd/cgroup memory ---
Restart=on-abort
Result=success
NRestarts=0
OOMPolicy=stop
MemoryCurrent=7254355968
ActiveState=active
SubState=running
[memory.current]
7254355968
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
00007efc7c000000   65524   65184   65184 rw---   [ anon ]
00007efc78000000   65516   65204   65204 rw---   [ anon ]
00007efc28000000   65528   65224   65224 rw---   [ anon ]
00007efc88000000   65532   65228   65228 rw---   [ anon ]
00007efe18000000   65524   65228   65228 rw---   [ anon ]
00007efc30000000   65520   65248   65248 rw---   [ anon ]
00007efc40000000   65532   65272   65272 rw---   [ anon ]
00007efc20000000   65516   65312   65312 rw---   [ anon ]
00007efc2c000000   65520   65352   65352 rw---   [ anon ]
00007efc44000000   65536   65392   65392 rw---   [ anon ]
00007efe54000000  131072  119588  119588 rw---   [ anon ]
00007efcf8000000  131060  123860  123860 rw---   [ anon ]
00007efd68000000  130948  126508  126508 rw---   [ anon ]
00007efda0000000  131036  126888  126888 rw---   [ anon ]
00007efc68000000  131072  130304  130304 rw---   [ anon ]
00007efc80000000  131072  130328  130328 rw---   [ anon ]
00007efc38000000  131060  130464  130464 rw---   [ anon ]
00007efc60000000  131064  130496  130496 rw---   [ anon ]
00007efc70000000  131068  130564  130564 rw---   [ anon ]
00007efe63599000  272796  155524  155524 rw---   [ anon ]

--- top connexions par memoire ---
352	fund_opcvm	localhost:38750	Sleep	2910	0.74	2.46
1626	fund_opcvm	localhost:50110	Sleep	2679	0.46	3.62
1620	fund_opcvm	localhost:50042	Sleep	2679	0.46	2.18
1629	fund_opcvm	localhost:50134	Sleep	2908	0.46	3.72
1785	fund_opcvm	localhost:57400	Sleep	2908	0.18	2.22
1910	fund_opcvm	localhost	Query	0	0.15	0.15
53	fund_opcvm	localhost:50778	Sleep	19	0.09	0.12
50	fund_opcvm	localhost:58608	Sleep	5	0.08	0.11

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
Sep 14 10:04:11 priceless-mayer systemd[1]: mariadb.service: A process of this unit has been killed by the OOM killer.
Sep 14 10:04:14 priceless-mayer systemd[1]: mariadb.service: Main process exited, code=killed, status=9/KILL
Sep 14 10:04:14 priceless-mayer systemd[1]: mariadb.service: Failed with result 'oom-kill'.
Sep 14 14:00:30 priceless-mayer mariadbd[1784030]: 2026-09-14 14:00:30 0 [Note] InnoDB: 10.6.23 started; log sequence number 52725173903; transaction id 20336935
Sep 14 14:00:30 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.

==============================================
 4. QUI CONSOMME, MAINTENANT
==============================================
8	fund_opcvm

==============================================
 5. SERIE COURTE RSS vs Memory_used
==============================================
SAMPLE ts=2026-09-14T22:52:39Z rss_kb=6999328 rssanon_kb=6974948 swap_kb=0 mariadb_memory_used_bytes=464836008 connections=9
SAMPLE ts=2026-09-14T22:52:54Z rss_kb=6999328 rssanon_kb=6974948 swap_kb=0 mariadb_memory_used_bytes=464836008 connections=9
SAMPLE ts=2026-09-14T22:53:09Z rss_kb=6999328 rssanon_kb=6974948 swap_kb=0 mariadb_memory_used_bytes=464836008 connections=9
SAMPLE ts=2026-09-14T22:53:24Z rss_kb=6999328 rssanon_kb=6974948 swap_kb=0 mariadb_memory_used_bytes=464836008 connections=9
SAMPLE ts=2026-09-14T22:53:39Z rss_kb=6999328 rssanon_kb=6974948 swap_kb=0 mariadb_memory_used_bytes=464836008 connections=9
SAMPLE ts=2026-09-14T22:53:54Z rss_kb=6999328 rssanon_kb=6974948 swap_kb=0 mariadb_memory_used_bytes=464836008 connections=9

==============================================
 FIN — aucune variable modifiee, aucun service redemarre
==============================================
```
