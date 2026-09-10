# Memoire MySQL — releve

> Genere par `ops-mysql-memoire.yml`. Lecture seule. Ne pas modifier a la main.

Derniere execution : **2026-09-10 05:30 UTC**
Declencheur : `workflow_dispatch` — par `Wealthtechinnovations`

```
==============================================
 1. MEMOIRE DE LA MACHINE
==============================================
               total        used        free      shared  buff/cache   available
Mem:           17945        9286         867         184        7792        8123
Swap:           2047         760        1287

RSS actuel de mariadbd :
  6.54 Go — demarre depuis 23:05:28

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
Max_used_connections	16
Threads_connected	9
Threads_running	1

==============================================
 3. LE PIRE CAS, CALCULE
==============================================
0.27	2.94	151	0.70	16	16

  Colonnes : global_Go | par_session_Mo | max_conn | pire_cas_Go | heap_Mo | tmp_Mo
  Comparer pire_cas_Go a la RAM totale relevee en section 1.
  Rappel : mariadbd a ete tue a 13,7 Go sur 17,9 Go de RAM.

==============================================
 3b. HISTORIQUE DES ARRETS — POURQUOI IL A REDEMARRE
==============================================
--- tueries memoire (OOM) sur 14 jours ---
Sep 08 20:02:42 priceless-mayer kernel: node invoked oom-killer: gfp_mask=0x1100cca(GFP_HIGHUSER_MOVABLE), order=0, oom_score_adj=0
Sep 08 20:02:42 priceless-mayer kernel: oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=cron.service,mems_allowed=0,global_oom,task_memcg=/system.slice/mariadb.service,task=mariadbd,pid=239498,uid=113
Sep 08 20:02:42 priceless-mayer kernel: Out of memory: Killed process 239498 (mariadbd) total-vm:19716580kB, anon-rss:14613428kB, file-rss:0kB, shmem-rss:0kB, UID:113 pgtables:33712kB oom_score_adj:0

--- demarrages et arrets du service sur 14 jours ---
Sep 08 20:02:42 priceless-mayer systemd[1]: mariadb.service: A process of this unit has been killed by the OOM killer.
Sep 08 20:02:44 priceless-mayer systemd[1]: mariadb.service: Main process exited, code=killed, status=9/KILL
Sep 08 20:02:44 priceless-mayer systemd[1]: mariadb.service: Failed with result 'oom-kill'.
Sep 09 06:25:02 priceless-mayer mariadbd[1256690]: 2026-09-09  6:25:02 0 [Note] InnoDB: 10.6.23 started; log sequence number 52527160550; transaction id 20187007
Sep 09 06:25:03 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.

==============================================
 4. QUI CONSOMME, MAINTENANT
==============================================
8	fund_opcvm

==============================================
 FIN — aucune variable modifiee, aucun service redemarre
==============================================
```
