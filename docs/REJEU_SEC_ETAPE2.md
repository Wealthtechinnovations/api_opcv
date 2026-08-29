# Rejeu SEC — etape 2, phase seche

> Genere par `ops-sec-replay-dryrun.yml`. Ne pas modifier a la main.
> **Aucune ecriture en base** : extraction dans un fichier dedie, import en dry-run.

Derniere execution : **2026-08-29 14:59 UTC**

```
==============================================
 0. MISE A JOUR ET VERSION DU CODE
==============================================
 * branch              claude/code-review-improvements-ikvuj -> FETCH_HEAD
   889088a5..dc1604c0  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Rebasing (1/597)Rebasing (2/597)Rebasing (3/597)Rebasing (4/597)Rebasing (5/597)Rebasing (6/597)Rebasing (7/597)Rebasing (8/597)Rebasing (9/597)Rebasing (10/597)Rebasing (11/597)Rebasing (12/597)Rebasing (13/597)Rebasing (14/597)Rebasing (15/597)Rebasing (16/597)Rebasing (17/597)Rebasing (18/597)Rebasing (19/597)Rebasing (20/597)Rebasing (21/597)Rebasing (22/597)Rebasing (23/597)Rebasing (24/597)Rebasing (25/597)Rebasing (26/597)Rebasing (27/597)Rebasing (28/597)Rebasing (29/597)Rebasing (30/597)Rebasing (31/597)Rebasing (32/597)Rebasing (33/597)Rebasing (34/597)Rebasing (35/597)Rebasing (36/597)Rebasing (37/597)Rebasing (38/597)Rebasing (39/597)Rebasing (40/597)Rebasing (41/597)Rebasing (42/597)Rebasing (43/597)Rebasing (44/597)Rebasing (45/597)Rebasing (46/597)Rebasing (47/597)Rebasing (48/597)Rebasing (49/597)Rebasing (50/597)Rebasing (51/597)Rebasing (52/597)Rebasing (53/597)Rebasing (54/597)Rebasing (55/597)Rebasing (56/597)Rebasing (57/597)Rebasing (58/597)Rebasing (59/597)Rebasing (60/597)Rebasing (61/597)Rebasing (62/597)Rebasing (63/597)Rebasing (64/597)Rebasing (65/597)Rebasing (66/597)Rebasing (67/597)Rebasing (68/597)Rebasing (69/597)Rebasing (70/597)Rebasing (71/597)Rebasing (72/597)Rebasing (73/597)Rebasing (74/597)Rebasing (75/597)Rebasing (76/597)Rebasing (77/597)Rebasing (78/597)Rebasing (79/597)Rebasing (80/597)Rebasing (81/597)Rebasing (82/597)Rebasing (83/597)Rebasing (84/597)Rebasing (85/597)Rebasing (86/597)Rebasing (87/597)Rebasing (88/597)Rebasing (89/597)Rebasing (90/597)Rebasing (91/597)Rebasing (92/597)Rebasing (93/597)Rebasing (94/597)Rebasing (95/597)Rebasing (96/597)Rebasing (97/597)Rebasing (98/597)Rebasing (99/597)Rebasing (100/597)Rebasing (101/597)Rebasing (102/597)Rebasing (103/597)Rebasing (104/597)Rebasing (105/597)Rebasing (106/597)Rebasing (107/597)Rebasing (108/597)Rebasing (109/597)Rebasing (110/597)Rebasing (111/597)Rebasing (112/597)Rebasing (113/597)Rebasing (114/597)Rebasing (115/597)Rebasing (116/597)Rebasing (117/597)Rebasing (118/597)Rebasing (119/597)Rebasing (120/597)Rebasing (121/597)Rebasing (122/597)Rebasing (123/597)Rebasing (124/597)Rebasing (125/597)Rebasing (126/597)Rebasing (127/597)Rebasing (128/597)Rebasing (129/597)Rebasing (130/597)Rebasing (131/597)Rebasing (132/597)Rebasing (133/597)Rebasing (134/597)Rebasing (135/597)Rebasing (136/597)Rebasing (137/597)Rebasing (138/597)Rebasing (139/597)Rebasing (140/597)Rebasing (141/597)Rebasing (142/597)Rebasing (143/597)Rebasing (144/597)Rebasing (145/597)Rebasing (146/597)Rebasing (147/597)Rebasing (148/597)Rebasing (149/597)Rebasing (150/597)Rebasing (151/597)Rebasing (152/597)Rebasing (153/597)Rebasing (154/597)Rebasing (155/597)Rebasing (156/597)Rebasing (157/597)Rebasing (158/597)Rebasing (159/597)Rebasing (160/597)Rebasing (161/597)Rebasing (162/597)Rebasing (163/597)Rebasing (164/597)Rebasing (165/597)Rebasing (166/597)Rebasing (167/597)Rebasing (168/597)Rebasing (169/597)Rebasing (170/597)Rebasing (171/597)Rebasing (172/597)Rebasing (173/597)Rebasing (174/597)Rebasing (175/597)Rebasing (176/597)Rebasing (177/597)Rebasing (178/597)Rebasing (179/597)Rebasing (180/597)Rebasing (181/597)Rebasing (182/597)Rebasing (183/597)Rebasing (184/597)Rebasing (185/597)Rebasing (186/597)Rebasing (187/597)Rebasing (188/597)Rebasing (189/597)Rebasing (190/597)Rebasing (191/597)Rebasing (192/597)Rebasing (193/597)Rebasing (194/597)Rebasing (195/597)Rebasing (196/597)Rebasing (197/597)Rebasing (198/597)Rebasing (199/597)Rebasing (200/597)Rebasing (201/597)Rebasing (202/597)Rebasing (203/597)Rebasing (204/597)Rebasing (205/597)Rebasing (206/597)Rebasing (207/597)Rebasing (208/597)Rebasing (209/597)Rebasing (210/597)Rebasing (211/597)Rebasing (212/597)Rebasing (213/597)Rebasing (214/597)Rebasing (215/597)Rebasing (216/597)Rebasing (217/597)Rebasing (218/597)Rebasing (219/597)Rebasing (220/597)Rebasing (221/597)Rebasing (222/597)Rebasing (223/597)Rebasing (224/597)Rebasing (225/597)Rebasing (226/597)Rebasing (227/597)Rebasing (228/597)Rebasing (229/597)Rebasing (230/597)Rebasing (231/597)Rebasing (232/597)Rebasing (233/597)Rebasing (234/597)Rebasing (235/597)Rebasing (236/597)Rebasing (237/597)Rebasing (238/597)Rebasing (239/597)Rebasing (240/597)Rebasing (241/597)Rebasing (242/597)Rebasing (243/597)Rebasing (244/597)Rebasing (245/597)Rebasing (246/597)Rebasing (247/597)Rebasing (248/597)Rebasing (249/597)Rebasing (250/597)Rebasing (251/597)Rebasing (252/597)Rebasing (253/597)Rebasing (254/597)Rebasing (255/597)Rebasing (256/597)Rebasing (257/597)Rebasing (258/597)Rebasing (259/597)Rebasing (260/597)Rebasing (261/597)Rebasing (262/597)Rebasing (263/597)Rebasing (264/597)Rebasing (265/597)Rebasing (266/597)Rebasing (267/597)Rebasing (268/597)Rebasing (269/597)Rebasing (270/597)Rebasing (271/597)Rebasing (272/597)Rebasing (273/597)Rebasing (274/597)Rebasing (275/597)Rebasing (276/597)Rebasing (277/597)Rebasing (278/597)Rebasing (279/597)Rebasing (280/597)Rebasing (281/597)Rebasing (282/597)Rebasing (283/597)Rebasing (284/597)Rebasing (285/597)Rebasing (286/597)Rebasing (287/597)Rebasing (288/597)Rebasing (289/597)Rebasing (290/597)Rebasing (291/597)Rebasing (292/597)Rebasing (293/597)Rebasing (294/597)Rebasing (295/597)Rebasing (296/597)Rebasing (297/597)Rebasing (298/597)Rebasing (299/597)Rebasing (300/597)Rebasing (301/597)Rebasing (302/597)Rebasing (303/597)Rebasing (304/597)Rebasing (305/597)Rebasing (306/597)Rebasing (307/597)Rebasing (308/597)Rebasing (309/597)Rebasing (310/597)Rebasing (311/597)Rebasing (312/597)Rebasing (313/597)Rebasing (314/597)Rebasing (315/597)Rebasing (316/597)Rebasing (317/597)Rebasing (318/597)Rebasing (319/597)Rebasing (320/597)Rebasing (321/597)Rebasing (322/597)Rebasing (323/597)Rebasing (324/597)Rebasing (325/597)Rebasing (326/597)Rebasing (327/597)Rebasing (328/597)Rebasing (329/597)Rebasing (330/597)Rebasing (331/597)Rebasing (332/597)Rebasing (333/597)Rebasing (334/597)Rebasing (335/597)Rebasing (336/597)Rebasing (337/597)Rebasing (338/597)Rebasing (339/597)Rebasing (340/597)Rebasing (341/597)Rebasing (342/597)Rebasing (343/597)Rebasing (344/597)Rebasing (345/597)Rebasing (346/597)Rebasing (347/597)Rebasing (348/597)Rebasing (349/597)Rebasing (350/597)Rebasing (351/597)Rebasing (352/597)Rebasing (353/597)Rebasing (354/597)Rebasing (355/597)Rebasing (356/597)Rebasing (357/597)Rebasing (358/597)Rebasing (359/597)Rebasing (360/597)Rebasing (361/597)Rebasing (362/597)Rebasing (363/597)Rebasing (364/597)Rebasing (365/597)Rebasing (366/597)Rebasing (367/597)Rebasing (368/597)Rebasing (369/597)Rebasing (370/597)Rebasing (371/597)Rebasing (372/597)Rebasing (373/597)Rebasing (374/597)Rebasing (375/597)Rebasing (376/597)Rebasing (377/597)Rebasing (378/597)Rebasing (379/597)Rebasing (380/597)Rebasing (381/597)Rebasing (382/597)Rebasing (383/597)Rebasing (384/597)Rebasing (385/597)Rebasing (386/597)Rebasing (387/597)Rebasing (388/597)Rebasing (389/597)Rebasing (390/597)Rebasing (391/597)Rebasing (392/597)Rebasing (393/597)Rebasing (394/597)Rebasing (395/597)Rebasing (396/597)Rebasing (397/597)Rebasing (398/597)Rebasing (399/597)Rebasing (400/597)Rebasing (401/597)Rebasing (402/597)Rebasing (403/597)Rebasing (404/597)Rebasing (405/597)Rebasing (406/597)Rebasing (407/597)Rebasing (408/597)Rebasing (409/597)Rebasing (410/597)Rebasing (411/597)Rebasing (412/597)Rebasing (413/597)Rebasing (414/597)Rebasing (415/597)Rebasing (416/597)Rebasing (417/597)Rebasing (418/597)Rebasing (419/597)Rebasing (420/597)Rebasing (421/597)Rebasing (422/597)Rebasing (423/597)Rebasing (424/597)Rebasing (425/597)Rebasing (426/597)Rebasing (427/597)Rebasing (428/597)Rebasing (429/597)Rebasing (430/597)Rebasing (431/597)Rebasing (432/597)Rebasing (433/597)Rebasing (434/597)Rebasing (435/597)Rebasing (436/597)Rebasing (437/597)Rebasing (438/597)Rebasing (439/597)Rebasing (440/597)Rebasing (441/597)Rebasing (442/597)Rebasing (443/597)Rebasing (444/597)Rebasing (445/597)Rebasing (446/597)Rebasing (447/597)Rebasing (448/597)Rebasing (449/597)Rebasing (450/597)Rebasing (451/597)Rebasing (452/597)Rebasing (453/597)Rebasing (454/597)Rebasing (455/597)Rebasing (456/597)Rebasing (457/597)Rebasing (458/597)Rebasing (459/597)Rebasing (460/597)Rebasing (461/597)Rebasing (462/597)Rebasing (463/597)Rebasing (464/597)Rebasing (465/597)Rebasing (466/597)Rebasing (467/597)Rebasing (468/597)Rebasing (469/597)Rebasing (470/597)Rebasing (471/597)Rebasing (472/597)Rebasing (473/597)Rebasing (474/597)Rebasing (475/597)Rebasing (476/597)Rebasing (477/597)Rebasing (478/597)Rebasing (479/597)Rebasing (480/597)Rebasing (481/597)Rebasing (482/597)Rebasing (483/597)Rebasing (484/597)Rebasing (485/597)Rebasing (486/597)Rebasing (487/597)Rebasing (488/597)Rebasing (489/597)Rebasing (490/597)Rebasing (491/597)Rebasing (492/597)Rebasing (493/597)Rebasing (494/597)Rebasing (495/597)Rebasing (496/597)Rebasing (497/597)Rebasing (498/597)Rebasing (499/597)Rebasing (500/597)Rebasing (501/597)Rebasing (502/597)Rebasing (503/597)Rebasing (504/597)Rebasing (505/597)Rebasing (506/597)Rebasing (507/597)Rebasing (508/597)Rebasing (509/597)Rebasing (510/597)Rebasing (511/597)Rebasing (512/597)Rebasing (513/597)Rebasing (514/597)Rebasing (515/597)Rebasing (516/597)Rebasing (517/597)Rebasing (518/597)Rebasing (519/597)Rebasing (520/597)Rebasing (521/597)Rebasing (522/597)Rebasing (523/597)Rebasing (524/597)Rebasing (525/597)Rebasing (526/597)Rebasing (527/597)Rebasing (528/597)Rebasing (529/597)Rebasing (530/597)Rebasing (531/597)Rebasing (532/597)Rebasing (533/597)Rebasing (534/597)Rebasing (535/597)Rebasing (536/597)Rebasing (537/597)Rebasing (538/597)Rebasing (539/597)Rebasing (540/597)Rebasing (541/597)Rebasing (542/597)Rebasing (543/597)Rebasing (544/597)Rebasing (545/597)Rebasing (546/597)Rebasing (547/597)Rebasing (548/597)Rebasing (549/597)Rebasing (550/597)Rebasing (551/597)Rebasing (552/597)Rebasing (553/597)Rebasing (554/597)Rebasing (555/597)Rebasing (556/597)Rebasing (557/597)Rebasing (558/597)Rebasing (559/597)Rebasing (560/597)Rebasing (561/597)Rebasing (562/597)Rebasing (563/597)Rebasing (564/597)Rebasing (565/597)Rebasing (566/597)Rebasing (567/597)Rebasing (568/597)Rebasing (569/597)Rebasing (570/597)Rebasing (571/597)Rebasing (572/597)Rebasing (573/597)Rebasing (574/597)Rebasing (575/597)Rebasing (576/597)Rebasing (577/597)Rebasing (578/597)Rebasing (579/597)Rebasing (580/597)Rebasing (581/597)Rebasing (582/597)Rebasing (583/597)Rebasing (584/597)Rebasing (585/597)Rebasing (586/597)Rebasing (587/597)Rebasing (588/597)Rebasing (589/597)Rebasing (590/597)Rebasing (591/597)Rebasing (592/597)Rebasing (593/597)Rebasing (594/597)Rebasing (595/597)Rebasing (596/597)Rebasing (597/597)                                                                                Successfully rebased and updated refs/heads/claude/code-review-improvements-ikvuj.
cc7a3776 chore: snapshot production state 2026-08-29 14:00
extracteur : 2026-08-29 14:45:15
annees rejouees : 2026 2025 2024 2023 2022

==============================================
 1. REJEU DE L EXTRACTION
==============================================
CSV (17 h) anterieur a l extracteur — reextraction imposee.
[OK] 2022 | NAV-as-at-23rd-December-2022.xlsx | rows=147 | dates=2022-12-23
[OK] 2022 | NAV-as-at-23rd-September-2022.xlsx | rows=143 | dates=2022-09-23
[OK] 2022 | NAV-as-at-24th-June-2022.xlsx | rows=139 | dates=2022-06-24
[OK] 2022 | NAV-as-at-25th-February-2022.xlsx | rows=135 | dates=2022-02-25
[OK] 2022 | NAV-as-at-25th-March-2022.xlsx | rows=135 | dates=2022-03-25
[OK] 2022 | NAV-as-at-25th-November-2022.xlsx | rows=143 | dates=2022-11-25
[OK] 2022 | NAV-as-at-26th-August-2022.xlsx | rows=140 | dates=2022-08-26
[OK] 2022 | NAV-as-at-27th-May-2022.xlsx | rows=136 | dates=2022-05-27
[OK] 2022 | NAV-as-at-28th-January-2022.xlsx | rows=135 | dates=2022-01-28
[OK] 2022 | NAV-as-at-28th-October-2022.xlsx | rows=143 | dates=2022-10-28
[OK] 2022 | NAV-as-at-29th-April-2022-1.xlsx | rows=136 | dates=2022-04-29
[OK] 2022 | NAV-as-at-29th-July-2022.xlsx | rows=140 | dates=2022-07-29
[OK] 2022 | NAV-as-at-2nd-December-2022-1.xlsx | rows=144 | dates=2022-12-02
[OK] 2022 | NAV-as-at-2nd-September-2022-1.xlsx | rows=140 | dates=2022-09-02
[OK] 2022 | NAV-as-at-30th-December-2022-2.xlsx | rows=147 | dates=2022-12-30
[OK] 2022 | NAV-as-at-30th-September-2022.xlsx | rows=143 | dates=2022-09-30
[OK] 2022 | NAV-as-at-3rd-June-2022.xlsx | rows=138 | dates=2022-06-03
[OK] 2022 | NAV-as-at-4th-February-2022.xlsx | rows=135 | dates=2022-02-04
[OK] 2022 | NAV-as-at-4th-March-2022.xlsx | rows=135 | dates=2022-03-04
[OK] 2022 | NAV-as-at-4th-November-2022.xlsx | rows=143 | dates=2022-11-04
[OK] 2022 | NAV-as-at-5th-August-2022.xlsx | rows=140 | dates=2022-08-05
[OK] 2022 | NAV-as-at-6th-May-2022.xlsx | rows=136 | dates=2022-05-06
[OK] 2022 | NAV-as-at-7th-January-2022.xlsx | rows=134 | dates=2022-01-07
[OK] 2022 | NAV-as-at-7th-October-2022.xlsx | rows=143 | dates=2022-10-07
[OK] 2022 | NAV-as-at-8th-April-2022.xlsx | rows=136 | dates=2022-04-08
[OK] 2022 | NAV-as-at-8th-July-2022.xlsx | rows=139 | dates=2022-07-08
[OK] 2022 | NAV-as-at-9th-September-2022.xlsx | rows=143 | dates=2022-09-09

Extraction terminée.
Lignes extraites avant filtre qualité : 41626
Lignes écrites : 41626
Fichiers / feuilles audités : 239
Lignes de cohérence inter-fichiers : 155
Lignes de couverture annuelle : 5
Suggestions fuzzy naming : 4
CSV données : sec_ng_replay.csv
CSV audit : sec_ng_replay_audit.csv
CSV cohérence : sec_ng_replay_coherence.csv
CSV couverture annuelle : sec_ng_nav_annual_coverage_v6.csv
CSV fuzzy names : sec_ng_nav_fuzzy_names_v6.csv
code de sortie extraction : 0
lignes extraites : 41627

==============================================
 1bis. LA SEC PUBLIAIT-ELLE DES DOLLARS AVANT 2026 ?
==============================================

--- 2024 : sec_ng_downloads/2024/NAV-as-at-10th-May-2024.xlsx

Fichier : NAV-as-at-10th-May-2024.xlsx
Taille  : 111 Ko

=== Feuille « Weekly Valuation » — 14 premieres lignes, 28 colonnes ===

   ligne | c3   | c5   | c6   | c10  | c12  | c13  | c17  | c18 
   ------+------+------+------+------+------+------+------+-----
       1 | NAV, Unit Price and Yield  |                            |                            | NAV, Unit Price and Yield  |                            |                            | % Change (Current from Pre |                           
       2 | NAV (N)                    | Bid Price (N)              | Offer Price (N)            | NAV (N)                    | Bid Price (N)              | Offer Price (N)            | NAV (%)                    | Unit Price (%)            
       5 | 1107449066.19              | 326.589                    | 326.589                    | 1108661592.69              | 327.2068                   | 327.2068                   | 0.0010948824077043127      | 0.0018916742449990305     
       6 | 589659206.74               | 217.5912                   | 220.1762                   | 590668112.98               | 218.1688                   | 220.7453                   | 0.0017109988760760065      | 0.0025847480336203084     
       7 | 3903377380.09              | 36.3838                    | 37.4808                    | 3874257919.69              | 36.0366                    | 37.1231                    | -0.007460067926952195      | -0.009543552965785181     
       8 | 664079804.62               | 223.95                     | 223.95                     | 663910293.71               | 222.76                     | 222.76                     | -0.00025525683633304317    | -0.005313686090645224     
       9 | 600950766.67               | 0.8769                     | 0.8844                     | 601775936.12               | 0.8782                     | 0.8858                     | 0.001373106576720906       | 0.0015829941203076299     
      10 | 86134695.57                | 152.4337                   | 152.9425                   | 84987031.84                | 151.3585                   | 151.8595                   | -0.0133240585852806        | -0.007081092567468156     
      11 | 1005861902.19              | 269.8                      | 273.49                     | 1016806570.1               | 272.79                     | 276.54                     | 0.01088088522506999        | 0.011152144502541268      
      12 | 318315544.15               | 159.9                      | 162.24                     | 326427670.24               | 163.98                     | 166.47                     | 0.025484542740951893       | 0.026072485207100527      
      13 | 49111517.76                | 175.39                     | 180.2                      | 49111517.76                | 175.39                     | 180.2                      | 0                          | 0                         

   Cellules fusionnees (25 premieres) : A195:V195, A175:V175, A5:V5, A97:V97, A135:V135, A4:V4, A96:V96, A171:V171, A165:V165, A112:V112, U2:V2, A170:V170, A58:V58, A127:V127, A176:V176, A59:V59, A24:V24, A191:V191, R2:T2, A1:V1, A190:U190, D2:J2, A196:V196, A25:V25, A172:V172


--- 2025 : sec_ng_downloads/2025/NAV-as-at-10th-January-2025.xlsx

Fichier : NAV-as-at-10th-January-2025.xlsx
Taille  : 111 Ko

=== Feuille « Weekly Valuation » — 14 premieres lignes, 28 colonnes ===

   ligne | c3   | c6   | c10  | c12  | c13  | c17  | c18 
   ------+------+------+------+------+------+------+-----
       1 | NAV, Unit Price and Yield  |                            | NAV, Unit Price and Yield  |                            |                            | % Change (Current from Pre |                           
       2 | NAV (N)                    | Offer Price (N)            | NAV (N)                    | Bid Price (N)              | Offer Price (N)            | NAV (%)                    | Unit Price (%)            
       5 | 1353527614.21              | 399.0338                   | 1381350889.58              | 404.8552                   | 404.8552                   | 0.020556119489471385       | 0.014588739099294446      
       6 | 637160680.2800002          | 264.827                    | 647034038.3                | 265.9668                   | 268.9957                   | 0.015495868350917222       | 0.015741219739679117      
       7 | 3945355206.55              | 36.8007                    | 3991659685.26              | 36.2902                    | 37.3844                    | 0.011736453699562022       | 0.015861111337556088      
       8 | 650704325.64               | 220.8774                   | 654420698.13               | 222.5808                   | 222.5808                   | 0.005711307491839359       | 0.007711970532068995      
       9 | 975615058.31               | 1.2704                     | 986766885.75               | 1.2609                     | 1.2769                     | 0.011430561003555753       | 0.005116498740554117      
      10 | 95906837.66                | 173.8007                   | 96433645.83                | 173.943                    | 174.7568                   | 0.005492915654956669       | 0.005501128591541876      
      11 | 1214811700.58              | 334.7                      | 1217866641.39              | 334.32                     | 338.24                     | 0.0025147443085554986      | 0.010576635793247746      
      12 | 413032073.66               | 216                        | 433732198.97               | 217.44                     | 226.49                     | 0.05011747665640113        | 0.04856481481481486       
      13 | 60338797                   | 221.68                     | 63378121.26                | 225.62                     | 232.87                     | 0.050370978725346446       | 0.05047816672681341       

   Cellules fusionnees (25 premieres) : B212:U212, A213:V213, A5:V5, A188:V188, A150:V150, A106:V106, B181:V181, A125:V125, U2:V2, A67:V67, B187:V187, A182:V182, B192:V192, A222:V222, A142:V142, R2:T2, A107:V107, A1:V1, B124:V124, B207:V207, D2:J2, B221:V221, B4:V4, A193:V193, A217:V217


--- 2026 : sec_ng_downloads/2026/Net_Asset_Value_and_Unit_Price_as_at_10th_April_2026.xlsx

Fichier : Net_Asset_Value_and_Unit_Price_as_at_10th_April_2026.xlsx
Taille  : 125 Ko

=== Feuille « Weekly Valuation » — 14 premieres lignes, 28 colonnes ===

   ligne | c3   | c5   | c6   | c10  | c12  | c13  | c17  | c18 
   ------+------+------+------+------+------+------+------+-----
       1 | NAV, Unit Price and Yield  |                            |                            | NAV, Unit Price and Yield  |                            |                            | % Change (Current from Pre |                           
       2 | NAV (N)                    | Bid Price (N)              | Offer Price (N)            | NAV (N)                    | Bid Price (N)              | Offer Price (N)            | NAV (%)                    | Unit Price (%)            
       5 | 10196027074.07             | 790.647                    | 794.1546                   | 10385460485.78             | 802.1324                   | 805.7062                   | 0.01857913973097993        | 0.014545782395518465      
       6 | 1794091931.85              | 532.7479                   | 539.6337                   | 1807192968.54              | 536.9699                   | 543.9225                   | 0.007302321836145131       | 0.007947613353280267      
       7 | 13390572116.61             | 67.1674                    | 69.1925                    | 14089650102.39             | 68.4121                    | 70.4748                    | 0.052206730204816636       | 0.018532355385338102      
       8 | 2299920059.65              | 316.0827                   | 316.0827                   | 2439502334.13              | 322.7073                   | 322.7073                   | 0.060690054810531774       | 0.02095843904142804       
       9 | 6556404938.68              | 2.4489                     | 2.4788                     | 7060077309.34              | 2.5212                     | 2.5543                     | 0.0768214250600275         | 0.030458286267548772      
      10 | 575754146.9                | 286.0856                   | 288.4676                   | 590258688.9                | 294.6197                   | 297.0934                   | 0.02519224929268156        | 0.02990214498959318       
      11 | 5144896219.59              | 555.4                      | 563.8                      | 5308402755.85              | 567.26                     | 575.84                     | 0.031780337111062304       | 0.02135509045760922       
      12 | 552242451.58               | 275.83                     | 288.08                     | 613362440.67               | 306.38                     | 320.02                     | 0.11067600637207774        | 0.11087198000555401       
      13 | 123196265.4739             | 427.7364                   | 441.9325                   | 125792078.0914             | 436.5425                   | 451.0928                   | 0.02107054631497684        | 0.02072782608203743       

   Cellules fusionnees (25 premieres) : B77:V77, A213:V213, B140:V140, A5:V5, B253:V253, A254:V254, A141:V141, A206:V206, B119:V119, A121:V121, A28:V28, U2:V2, B205:V205, A249:V249, B172:V172, A173:V173, B240:U240, B211:V211, R2:T2, A1:V1, A241:V241, B216:V216, D2:J2, A78:V78, B163:V163


==============================================
 1ter. BALAYAGE DE TOUS LES FICHIERS SEC
==============================================
  108 au format .xls ancien — openpyxl ne les ouvre pas
  130 fichier(s) ABSENTS du cache — le prompt V2.2 en recense 686 (2011-2026)
  Toute conclusion ci-dessous ne vaut donc que pour les fichiers PRESENTS.

  annee   fichiers  avec ($)  avec (N)  illisibles   part dollar
  ------ --------- --------- --------- -----------   -----------
  2018          52         0         0           0   0.0 %
  2019          52         0         0           0   0.0 %
  2020          53         0         0           0   0.0 %
  2021          52         0         6           0   0.0 %
  2022          51         0        51           0   0.0 %
  2023          52         0        52           0   0.0 %
  2024          52         0        52           0   0.0 %
  2025          51         0        51           0   0.0 %
  2026          33        16        33           0   48.5 %

  Total : 16 fichier(s) sur 448 lus portent au moins un en-tete en dollars.

  NON LUS — 108 fichiers .xls, par annee :
    2018 : 52
    2019 : 52
    2020 : 4
  Ils demandent une conversion LibreOffice, deja utilisee par l extracteur.
  Tant qu ils ne sont pas lus, aucune affirmation sur ces annees n est fondee.

  Fichiers a colonne dollar, par annee (ordre chronologique) :
    2026 : 16 fichier(s), du premier au dernier
      debut : Net_Asset_Value_and_Unit_Price_as_at_30th_April_2026.xlsx
      fin   : Net_Asset_Value_and_Unit_Price_as_at_14th_August_2026.xlsx

  Exemples d en-tetes en dollars :
    Net_Asset_Value_and_Unit_Price_as_at_10th_July_2026.xlsx — « NAV ($) »
    Net_Asset_Value_and_Unit_Price_as_at_11th_June_2026.xlsx — « NAV ($) »
    Net_Asset_Value_and_Unit_Price_as_at_14th_August_2026.xlsx — « NAV ($) »
    Net_Asset_Value_and_Unit_Price_as_at_15th_May_2026.xlsx — « NAV ($) »
    Net_Asset_Value_and_Unit_Price_as_at_17th_July_2026.xlsx — « NAV ($) »
    Net_Asset_Value_and_Unit_Price_as_at_19th_June_2026.xlsx — « NAV ($) »
    Net_Asset_Value_and_Unit_Price_as_at_22nd_May_2026.xlsx — « NAV ($) »
    Net_Asset_Value_and_Unit_Price_as_at_24th_July_2026.xlsx — « NAV ($) »


==============================================
 2. SIMULATION DE L IMPORT (aucune ecriture)
==============================================
Lecture de sec_ng_replay.csv...
41626 lignes lues depuis le CSV
41471 lignes valides (avec date + prix + nom)
  155 lignes rejetees (VL hors bornes [0.0001-1000000] ou NAV > 5000000000000)
314 fonds distincts identifies
*** MODE DRY-RUN: aucune ecriture en base ***

Connecte a la base fund_opcvm
Chargement des taux de change...
  132196 entrees forex chargees
329 fonds Nigeria existants en base
  Progression: 20/314 fonds (0 VL inserees)...
  Progression: 40/314 fonds (0 VL inserees)...
  Progression: 60/314 fonds (0 VL inserees)...
  Progression: 80/314 fonds (0 VL inserees)...
  Progression: 100/314 fonds (0 VL inserees)...
  Progression: 120/314 fonds (0 VL inserees)...
  Progression: 140/314 fonds (0 VL inserees)...
  Progression: 160/314 fonds (0 VL inserees)...
  Progression: 180/314 fonds (0 VL inserees)...
  Progression: 200/314 fonds (0 VL inserees)...
  Progression: 220/314 fonds (0 VL inserees)...
  Progression: 240/314 fonds (0 VL inserees)...
  Progression: 260/314 fonds (0 VL inserees)...
  Progression: 280/314 fonds (0 VL inserees)...
  Progression: 300/314 fonds (0 VL inserees)...


==========================================
=== RAPPORT IMPORT VL NIGERIA (SEC) ===
==========================================
Fichier CSV:                   sec_ng_replay.csv
Lignes CSV totales:            41626
Lignes valides:                41471
Fonds dans le CSV:             314
Fonds matches (existants):     306
  dont fuzzy match:            4
Fonds crees (nouveaux):        8
Fonds ignores (--skip-existing): 0
Fonds metadata MAJ:            0
VL inserees:                   0
VL deja existantes (gardees):  0
VL sans taux forex:            0
Erreurs:                       0

Contrat d ecriture:            mode warn, lot SECNG_20260829_145900
  Qualite des mesures:         (aucune)
  Mesures refusees:            0
  Rollback de ce lot:          DELETE FROM valorisations WHERE correction_batch = 'SECNG_20260829_145900'

Matches fuzzy (a verifier):
  CSV: "Nigeria Real Estate Investment Trust" <-> DB: "NIGERIAN REAL ESTATE INVESTMENT TRUST" (sim=0.954)
  CSV: "D'Namaz Halal Fixed Income Fund" <-> DB: "D NAMAZ HALAL FIXED INCOME FUND" (sim=0.963)
  CSV: "FBN Bond Fund (FBN Fixed Income Fund)" <-> DB: "FBN BOND FUND (FIXED INCOME)" (sim=0.977)
  CSV: "Women's Balanced Fund (Gender/Diversity)" <-> DB: "WOMEN S BALANCED FUND (GENDER/DIVERSITY)" (sim=0.954)

Categories extraites:
  OBLIGATAIRE (73 fonds) => OBLIGATIONS / OBLIGATIONS
  MONETAIRE (58 fonds) => MONETAIRE / MONETAIRE
  AUTRE (53 fonds) => AUTRE / AUTRE
  DIVERSIFIE (40 fonds) => DIVERSIFIE / DIVERSIFIE
  DOLLAR (32 fonds) => DOLLAR / DOLLAR
  ACTIONS (29 fonds) => ACTIONS / ACTIONS
  ETF (13 fonds) => ETF / ETF
  IMMOBILIER (7 fonds) => IMMOBILIER / IMMOBILIER
  ETHIQUE (5 fonds) => ETHIQUE / ETHIQUE
  INFRASTRUCTURE (3 fonds) => INFRASTRUCTURE / INFRASTRUCTURE
  CHARIA (1 fonds) => CHARIA / CHARIA

VL par annee:
  2022: 7079 VL
  2023: 7630 VL
  2024: 9050 VL
  2025: 10355 VL
  2026: 7203 VL

*** MODE DRY-RUN: aucune modification en base ***

Connexion fermee

==============================================
 3. ECART ENTRE LE FICHIER RELU ET LA BASE
==============================================

=== ECART ENTRE LE FICHIER SEC RELU ET LA BASE ===
Mesure le 2026-08-29 14:59:03 UTC — LECTURE SEULE
CSV : sec_ng_replay.csv

Lignes CSV : 41626
Fonds Nigeria en base : 329
VL Nigeria en base : 77315

## A. Appariement

    40826 ligne(s) CSV appariees a un fonds en base
      646 ligne(s) sans fonds correspondant (nom inconnu)
     1085 ligne(s) dont la date n est pas en base — un import les AJOUTERAIT
    27077 ligne(s) identiques a moins de 1 %
    12664 ligne(s) EN ECART

## B. Nature des ecarts

      378 changement(s) d ECHELLE (facteur >= 10) — les ruptures visees
    12286 ecart(s) mineur(s) (1 % a 10x) — a instruire separement, ne pas corriger en masse

## C. Changements d echelle — ce qu une correction ecrirait

  fonds dev  date                en base    relu dans SEC     fact. dev.relue nom
  ----- ---- ---------- ---------------- ---------------- --------- --------- ---
   1141 NGN  2026-07-10      165207.2996         119.2832    1385.0 USD       AFRINVEST DOLLAR FUND
   2764 NGN  2026-07-10      147826.2937         107.0000    1381.6 USD       AIICO EUROBOND FUND
   1154 NGN  2026-07-10        1708.3601           1.2368    1381.3 USD       ARM EUROBOND FUND
   2861 NGN  2026-07-10        1475.9698           1.0694    1380.2 USD       ARM SHORT-TERM EUROBOND FUND
   2765 USD  2026-07-10        1799.0246           1.2988    1385.1 USD       CARDINALSTONE DOLLAR FUND
   2766 USD  2026-07-10        1391.3469           1.0900    1276.5 USD       COMERCIO PARTNERS DOLLAR FUND
   2767 NGN  2026-07-10        2101.9892           1.5209    1382.1 USD       COWRY EUROBOND FUND
   1196 NGN  2026-07-10      159006.0360         114.9100    1383.7 USD       EMERGING AFRICA EUROBOND FUND
   2878 USD  2026-07-10        2124.6150           1.5300    1388.6 USD       FCMBAM USD Bond Fund
   2876 USD  2026-07-10      183694.8768         132.7800    1383.5 USD       First Asset Dollar Fund (Retai
   2877 USD  2026-07-10      179342.8998         129.6400    1383.4 USD       First Asset Specialized Dollar
   1214 NGN  2026-07-10      203121.3294         147.0575    1381.2 USD       FUTUREVIEW DOLLAR FUND
   1170 NGN  2026-07-10      145053.2573         104.9000    1382.8 USD       NORRENBERGER DOLLAR FUND
   1244 NGN  2026-07-10      224767.7067         168.8500    1331.2 USD       PACAM EUROBOND FUND
   2866 NGN  2026-07-10      167122.1339         120.7800    1383.7 USD       United Capital Nigerian Eurobo
   1158 NGN  2026-07-10      165085.3412         119.2600    1384.2 USD       AVA GAM FIXED INCOME DOLLAR FU
   1160 NGN  2026-07-10      192015.5255         139.0600    1380.8 USD       AXA MANSARD DOLLAR BOND FUND
   2770 USD  2026-07-10      146170.7496         105.8100    1381.4 USD       CFG AM FIXED INCOME DOLLAR FUN
   1175 NGN  2026-07-10      161556.6000         116.9400    1381.5 USD       CORDROS DOLLAR FUND
   2771 USD  2026-07-10        1419.3532           1.0248    1385.0 USD       CORONATION DOLLAR FUND
   1213 NGN  2026-07-10        1920.0700           1.3890    1382.3 USD       FSDH DOLLAR FUND
   2774 USD  2026-07-10       15065.4515          10.8800    1384.7 USD       MERISTEM DOLLAR FUND
   1168 NGN  2026-07-10        1503.7859           1.0845    1386.6 USD       NIGERIA DOLLAR INCOME FUND
   2775 USD  2026-07-10        1499.9230           1.0842    1383.4 USD       PARTHIAN DOLLAR FIXED INCOME F
   1257 NGN  2026-07-10        2355.8702           1.7040    1382.6 USD       STANBIC IBTC DOLLAR FUND
   2776 USD  2026-07-10      162767.5794         117.8200    1381.5 USD       STL DOLLAR FUND
   1274 NGN  2026-07-10        1662.7315           1.2023    1382.9 USD       UNITED CAPITAL GLOBAL FIXED IN
   2857 NGN  2026-07-10      159627.7500         116.2000    1373.7 USD       RMBN DOLLAR FIXED INCOME FUND
   2777 USD  2026-07-10        1641.7479           1.1800    1391.3 USD       VETIVA USD FIXED INCOME FUND
   2858 NGN  2026-07-10        1462.0144           1.0591    1380.4 USD       ARM SPECIALIZED DOLLAR FUND
   2879 USD  2026-07-10      155731.6976         112.3000    1386.7 USD       First Asset Blended Dollar Fun
   2880 USD  2026-07-10       13711.0784           9.9228    1381.8 USD       ValuAlliance Specialized Dolla
   1141 NGN  2026-06-11      162039.7306         118.7592    1364.4 USD       AFRINVEST DOLLAR FUND
   2764 NGN  2026-06-11      145315.5537         106.6300    1362.8 USD       AIICO EUROBOND FUND
   1154 NGN  2026-06-11        1681.9916           1.2352    1361.7 USD       ARM EUROBOND FUND
   2861 NGN  2026-06-11        1452.2827           1.0662    1362.1 USD       ARM SHORT-TERM EUROBOND FUND
   2765 USD  2026-06-11        1766.5625           1.3005    1358.4 USD       CARDINALSTONE DOLLAR FUND
   2767 NGN  2026-06-11        2063.7400           1.5246    1353.6 USD       COWRY EUROBOND FUND
   1189 NGN  2026-06-11      151466.4045         111.6600    1356.5 USD       EDC DOLLAR FUND
   1196 NGN  2026-06-11      156278.8500         114.3909    1366.2 USD       EMERGING AFRICA EUROBOND FUND
   2876 USD  2026-06-11      179937.4508         131.9600    1363.6 USD       First Asset Dollar Fund (Retai
   2877 USD  2026-06-11      175673.0136         128.8400    1363.5 USD       First Asset Specialized Dollar
   1214 NGN  2026-06-11      199875.7820         146.3042    1366.2 USD       FUTUREVIEW DOLLAR FUND
   2809 USD  2026-06-11        1533.6744           1.0060    1524.5 USD       MYRTLE DOLLAR SHIELD FUND
   1170 NGN  2026-06-11      147047.6115         107.8700    1363.2 USD       NORRENBERGER DOLLAR FUND
   1244 NGN  2026-06-11      222603.5165         169.7200    1311.6 USD       PACAM EUROBOND FUND
   2866 NGN  2026-06-11      174368.2666         127.6365    1366.1 USD       United Capital Nigerian Eurobo
   1158 NGN  2026-06-11      162622.4930         119.1200    1365.2 USD       AVA GAM FIXED INCOME DOLLAR FU
   1160 NGN  2026-06-11      189176.1657         138.5800    1365.1 USD       AXA MANSARD DOLLAR BOND FUND
   2770 USD  2026-06-11      143760.7932         105.3200    1365.0 USD       CFG AM FIXED INCOME DOLLAR FUN
   1175 NGN  2026-06-11      158680.4600         116.3100    1364.3 USD       CORDROS DOLLAR FUND
   2771 USD  2026-06-11        1432.9709           1.0529    1361.0 USD       CORONATION DOLLAR FUND
   1213 NGN  2026-06-11        1883.2300           1.3799    1364.8 USD       FSDH DOLLAR FUND
   2774 USD  2026-06-11       14811.1395          10.8400    1366.3 USD       MERISTEM DOLLAR FUND
   1168 NGN  2026-06-11        1530.7572           1.1265    1358.9 USD       NIGERIA DOLLAR INCOME FUND
   2775 USD  2026-06-11        1480.9776           1.0874    1361.9 USD       PARTHIAN DOLLAR FIXED INCOME F
   1257 NGN  2026-06-11        2316.4710           1.6989    1363.5 USD       STANBIC IBTC DOLLAR FUND
   2776 USD  2026-06-11      159840.2900         117.0400    1365.7 USD       STL DOLLAR FUND
   1274 NGN  2026-06-11        1743.8939           1.2756    1367.1 USD       UNITED CAPITAL GLOBAL FIXED IN
   2857 NGN  2026-06-11      158351.2300         116.3300    1361.2 USD       RMBN DOLLAR FIXED INCOME FUND
  ... et 318 autre(s)

  Sens : 339 correction(s) vers une valeur PLUS PETITE, 39 vers une PLUS GRANDE

## D. Devise que l extracteur corrige attribue a ces mesures

     306 ligne(s)   USD (source : column_header_matched_fund)
      43 ligne(s)   NGN (source : column_header_matched_fund)
      29 ligne(s)   NGN (source : column_header)


==============================================
 4. RUPTURES ENCORE PRESENTES EN BASE
==============================================

=== RUPTURES D ECHELLE RESTANTES — toutes dates confondues ===
Mesure le 2026-08-29 14:59:09 UTC — LECTURE SEULE
Critere : saut d un facteur >= 10 par rapport a la VL precedente du meme fonds

TOTAL : 233 ligne(s) sur 84 fonds

## Repartition par pays et lot d insertion

     91 ligne(s)   NIGERIA | insere le Sun Aug 02
     54 ligne(s)   NIGERIA | insere le Sun May 17
     16 ligne(s)   NIGERIA | insere le Mon Jun 22
     16 ligne(s)   NIGERIA | insere le Thu Jun 04
      9 ligne(s)   NIGERIA | insere le Mon Aug 24
      7 ligne(s)   NIGERIA | insere le Mon Jul 06
      7 ligne(s)   NIGERIA | insere le Mon Jun 08
      7 ligne(s)   NIGERIA | insere le Mon Jun 01
      5 ligne(s)   Nigeria | insere le Mon Aug 24
      4 ligne(s)   NIGERIA | insere le Mon Jun 29
      3 ligne(s)   NIGERIA | insere le Mon Jul 27
```
