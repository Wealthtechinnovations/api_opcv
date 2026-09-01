# Memoire MySQL — releve

> Genere par `ops-mysql-memoire.yml`. Lecture seule. Ne pas modifier a la main.

Derniere execution : **2026-09-01 04:26 UTC**
Declencheur : `push` — par `Wealthtechinnovations`

```
==============================================
 1. MEMOIRE DE LA MACHINE
==============================================
               total        used        free      shared  buff/cache   available
Mem:           17945        9718         252         219        7975        7656
Swap:           2047        1718         329

RSS actuel de mariadbd :
  6.95 Go — demarre depuis 09:51:54

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
Max_used_connections	24
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
 4. QUI CONSOMME, MAINTENANT
==============================================
8	fund_opcvm

==============================================
 FIN — aucune variable modifiee, aucun service redemarre
==============================================
```
