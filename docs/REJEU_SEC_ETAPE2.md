# Rejeu SEC — etape 2, phase seche

> Genere par `ops-sec-replay-dryrun.yml`. Ne pas modifier a la main.
> **Aucune ecriture en base** : extraction dans un fichier dedie, import en dry-run.

Derniere execution : **2026-08-29 10:00 UTC**

```
==============================================
 0. MISE A JOUR ET VERSION DU CODE
==============================================
 * branch              claude/code-review-improvements-ikvuj -> FETCH_HEAD
   2d47315c..459a651e  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Rebasing (1/592)Rebasing (2/592)Rebasing (3/592)Rebasing (4/592)Rebasing (5/592)Rebasing (6/592)Rebasing (7/592)Rebasing (8/592)Rebasing (9/592)Rebasing (10/592)Rebasing (11/592)Rebasing (12/592)Rebasing (13/592)Rebasing (14/592)Rebasing (15/592)Rebasing (16/592)Rebasing (17/592)Rebasing (18/592)Rebasing (19/592)Rebasing (20/592)Rebasing (21/592)Rebasing (22/592)Rebasing (23/592)Rebasing (24/592)Rebasing (25/592)Rebasing (26/592)Rebasing (27/592)Rebasing (28/592)Rebasing (29/592)Rebasing (30/592)Rebasing (31/592)Rebasing (32/592)Rebasing (33/592)Rebasing (34/592)Rebasing (35/592)Rebasing (36/592)Rebasing (37/592)Rebasing (38/592)Rebasing (39/592)Rebasing (40/592)Rebasing (41/592)Rebasing (42/592)Rebasing (43/592)Rebasing (44/592)Rebasing (45/592)Rebasing (46/592)Rebasing (47/592)Rebasing (48/592)Rebasing (49/592)Rebasing (50/592)Rebasing (51/592)Rebasing (52/592)Rebasing (53/592)Rebasing (54/592)Rebasing (55/592)Rebasing (56/592)Rebasing (57/592)Rebasing (58/592)Rebasing (59/592)Rebasing (60/592)Rebasing (61/592)Rebasing (62/592)Rebasing (63/592)Rebasing (64/592)Rebasing (65/592)Rebasing (66/592)Rebasing (67/592)Rebasing (68/592)Rebasing (69/592)Rebasing (70/592)Rebasing (71/592)Rebasing (72/592)Rebasing (73/592)Rebasing (74/592)Rebasing (75/592)Rebasing (76/592)Rebasing (77/592)Rebasing (78/592)Rebasing (79/592)Rebasing (80/592)Rebasing (81/592)Rebasing (82/592)Rebasing (83/592)Rebasing (84/592)Rebasing (85/592)Rebasing (86/592)Rebasing (87/592)Rebasing (88/592)Rebasing (89/592)Rebasing (90/592)Rebasing (91/592)Rebasing (92/592)Rebasing (93/592)Rebasing (94/592)Rebasing (95/592)Rebasing (96/592)Rebasing (97/592)Rebasing (98/592)Rebasing (99/592)Rebasing (100/592)Rebasing (101/592)Rebasing (102/592)Rebasing (103/592)Rebasing (104/592)Rebasing (105/592)Rebasing (106/592)Rebasing (107/592)Rebasing (108/592)Rebasing (109/592)Rebasing (110/592)Rebasing (111/592)Rebasing (112/592)Rebasing (113/592)Rebasing (114/592)Rebasing (115/592)Rebasing (116/592)Rebasing (117/592)Rebasing (118/592)Rebasing (119/592)Rebasing (120/592)Rebasing (121/592)Rebasing (122/592)Rebasing (123/592)Rebasing (124/592)Rebasing (125/592)Rebasing (126/592)Rebasing (127/592)Rebasing (128/592)Rebasing (129/592)Rebasing (130/592)Rebasing (131/592)Rebasing (132/592)Rebasing (133/592)Rebasing (134/592)Rebasing (135/592)Rebasing (136/592)Rebasing (137/592)Rebasing (138/592)Rebasing (139/592)Rebasing (140/592)Rebasing (141/592)Rebasing (142/592)Rebasing (143/592)Rebasing (144/592)Rebasing (145/592)Rebasing (146/592)Rebasing (147/592)Rebasing (148/592)Rebasing (149/592)Rebasing (150/592)Rebasing (151/592)Rebasing (152/592)Rebasing (153/592)Rebasing (154/592)Rebasing (155/592)Rebasing (156/592)Rebasing (157/592)Rebasing (158/592)Rebasing (159/592)Rebasing (160/592)Rebasing (161/592)Rebasing (162/592)Rebasing (163/592)Rebasing (164/592)Rebasing (165/592)Rebasing (166/592)Rebasing (167/592)Rebasing (168/592)Rebasing (169/592)Rebasing (170/592)Rebasing (171/592)Rebasing (172/592)Rebasing (173/592)Rebasing (174/592)Rebasing (175/592)Rebasing (176/592)Rebasing (177/592)Rebasing (178/592)Rebasing (179/592)Rebasing (180/592)Rebasing (181/592)Rebasing (182/592)Rebasing (183/592)Rebasing (184/592)Rebasing (185/592)Rebasing (186/592)Rebasing (187/592)Rebasing (188/592)Rebasing (189/592)Rebasing (190/592)Rebasing (191/592)Rebasing (192/592)Rebasing (193/592)Rebasing (194/592)Rebasing (195/592)Rebasing (196/592)Rebasing (197/592)Rebasing (198/592)Rebasing (199/592)Rebasing (200/592)Rebasing (201/592)Rebasing (202/592)Rebasing (203/592)Rebasing (204/592)Rebasing (205/592)Rebasing (206/592)Rebasing (207/592)Rebasing (208/592)Rebasing (209/592)Rebasing (210/592)Rebasing (211/592)Rebasing (212/592)Rebasing (213/592)Rebasing (214/592)Rebasing (215/592)Rebasing (216/592)Rebasing (217/592)Rebasing (218/592)Rebasing (219/592)Rebasing (220/592)Rebasing (221/592)Rebasing (222/592)Rebasing (223/592)Rebasing (224/592)Rebasing (225/592)Rebasing (226/592)Rebasing (227/592)Rebasing (228/592)Rebasing (229/592)Rebasing (230/592)Rebasing (231/592)Rebasing (232/592)Rebasing (233/592)Rebasing (234/592)Rebasing (235/592)Rebasing (236/592)Rebasing (237/592)Rebasing (238/592)Rebasing (239/592)Rebasing (240/592)Rebasing (241/592)Rebasing (242/592)Rebasing (243/592)Rebasing (244/592)Rebasing (245/592)Rebasing (246/592)Rebasing (247/592)Rebasing (248/592)Rebasing (249/592)Rebasing (250/592)Rebasing (251/592)Rebasing (252/592)Rebasing (253/592)Rebasing (254/592)Rebasing (255/592)Rebasing (256/592)Rebasing (257/592)Rebasing (258/592)Rebasing (259/592)Rebasing (260/592)Rebasing (261/592)Rebasing (262/592)Rebasing (263/592)Rebasing (264/592)Rebasing (265/592)Rebasing (266/592)Rebasing (267/592)Rebasing (268/592)Rebasing (269/592)Rebasing (270/592)Rebasing (271/592)Rebasing (272/592)Rebasing (273/592)Rebasing (274/592)Rebasing (275/592)Rebasing (276/592)Rebasing (277/592)Rebasing (278/592)Rebasing (279/592)Rebasing (280/592)Rebasing (281/592)Rebasing (282/592)Rebasing (283/592)Rebasing (284/592)Rebasing (285/592)Rebasing (286/592)Rebasing (287/592)Rebasing (288/592)Rebasing (289/592)Rebasing (290/592)Rebasing (291/592)Rebasing (292/592)Rebasing (293/592)Rebasing (294/592)Rebasing (295/592)Rebasing (296/592)Rebasing (297/592)Rebasing (298/592)Rebasing (299/592)Rebasing (300/592)Rebasing (301/592)Rebasing (302/592)Rebasing (303/592)Rebasing (304/592)Rebasing (305/592)Rebasing (306/592)Rebasing (307/592)Rebasing (308/592)Rebasing (309/592)Rebasing (310/592)Rebasing (311/592)Rebasing (312/592)Rebasing (313/592)Rebasing (314/592)Rebasing (315/592)Rebasing (316/592)Rebasing (317/592)Rebasing (318/592)Rebasing (319/592)Rebasing (320/592)Rebasing (321/592)Rebasing (322/592)Rebasing (323/592)Rebasing (324/592)Rebasing (325/592)Rebasing (326/592)Rebasing (327/592)Rebasing (328/592)Rebasing (329/592)Rebasing (330/592)Rebasing (331/592)Rebasing (332/592)Rebasing (333/592)Rebasing (334/592)Rebasing (335/592)Rebasing (336/592)Rebasing (337/592)Rebasing (338/592)Rebasing (339/592)Rebasing (340/592)Rebasing (341/592)Rebasing (342/592)Rebasing (343/592)Rebasing (344/592)Rebasing (345/592)Rebasing (346/592)Rebasing (347/592)Rebasing (348/592)Rebasing (349/592)Rebasing (350/592)Rebasing (351/592)Rebasing (352/592)Rebasing (353/592)Rebasing (354/592)Rebasing (355/592)Rebasing (356/592)Rebasing (357/592)Rebasing (358/592)Rebasing (359/592)Rebasing (360/592)Rebasing (361/592)Rebasing (362/592)Rebasing (363/592)Rebasing (364/592)Rebasing (365/592)Rebasing (366/592)Rebasing (367/592)Rebasing (368/592)Rebasing (369/592)Rebasing (370/592)Rebasing (371/592)Rebasing (372/592)Rebasing (373/592)Rebasing (374/592)Rebasing (375/592)Rebasing (376/592)Rebasing (377/592)Rebasing (378/592)Rebasing (379/592)Rebasing (380/592)Rebasing (381/592)Rebasing (382/592)Rebasing (383/592)Rebasing (384/592)Rebasing (385/592)Rebasing (386/592)Rebasing (387/592)Rebasing (388/592)Rebasing (389/592)Rebasing (390/592)Rebasing (391/592)Rebasing (392/592)Rebasing (393/592)Rebasing (394/592)Rebasing (395/592)Rebasing (396/592)Rebasing (397/592)Rebasing (398/592)Rebasing (399/592)Rebasing (400/592)Rebasing (401/592)Rebasing (402/592)Rebasing (403/592)Rebasing (404/592)Rebasing (405/592)Rebasing (406/592)Rebasing (407/592)Rebasing (408/592)Rebasing (409/592)Rebasing (410/592)Rebasing (411/592)Rebasing (412/592)Rebasing (413/592)Rebasing (414/592)Rebasing (415/592)Rebasing (416/592)Rebasing (417/592)Rebasing (418/592)Rebasing (419/592)Rebasing (420/592)Rebasing (421/592)Rebasing (422/592)Rebasing (423/592)Rebasing (424/592)Rebasing (425/592)Rebasing (426/592)Rebasing (427/592)Rebasing (428/592)Rebasing (429/592)Rebasing (430/592)Rebasing (431/592)Rebasing (432/592)Rebasing (433/592)Rebasing (434/592)Rebasing (435/592)Rebasing (436/592)Rebasing (437/592)Rebasing (438/592)Rebasing (439/592)Rebasing (440/592)Rebasing (441/592)Rebasing (442/592)Rebasing (443/592)Rebasing (444/592)Rebasing (445/592)Rebasing (446/592)Rebasing (447/592)Rebasing (448/592)Rebasing (449/592)Rebasing (450/592)Rebasing (451/592)Rebasing (452/592)Rebasing (453/592)Rebasing (454/592)Rebasing (455/592)Rebasing (456/592)Rebasing (457/592)Rebasing (458/592)Rebasing (459/592)Rebasing (460/592)Rebasing (461/592)Rebasing (462/592)Rebasing (463/592)Rebasing (464/592)Rebasing (465/592)Rebasing (466/592)Rebasing (467/592)Rebasing (468/592)Rebasing (469/592)Rebasing (470/592)Rebasing (471/592)Rebasing (472/592)Rebasing (473/592)Rebasing (474/592)Rebasing (475/592)Rebasing (476/592)Rebasing (477/592)Rebasing (478/592)Rebasing (479/592)Rebasing (480/592)Rebasing (481/592)Rebasing (482/592)Rebasing (483/592)Rebasing (484/592)Rebasing (485/592)Rebasing (486/592)Rebasing (487/592)Rebasing (488/592)Rebasing (489/592)Rebasing (490/592)Rebasing (491/592)Rebasing (492/592)Rebasing (493/592)Rebasing (494/592)Rebasing (495/592)Rebasing (496/592)Rebasing (497/592)Rebasing (498/592)Rebasing (499/592)Rebasing (500/592)Rebasing (501/592)Rebasing (502/592)Rebasing (503/592)Rebasing (504/592)Rebasing (505/592)Rebasing (506/592)Rebasing (507/592)Rebasing (508/592)Rebasing (509/592)Rebasing (510/592)Rebasing (511/592)Rebasing (512/592)Rebasing (513/592)Rebasing (514/592)Rebasing (515/592)Rebasing (516/592)Rebasing (517/592)Rebasing (518/592)Rebasing (519/592)Rebasing (520/592)Rebasing (521/592)Rebasing (522/592)Rebasing (523/592)Rebasing (524/592)Rebasing (525/592)Rebasing (526/592)Rebasing (527/592)Rebasing (528/592)Rebasing (529/592)Rebasing (530/592)Rebasing (531/592)Rebasing (532/592)Rebasing (533/592)Rebasing (534/592)Rebasing (535/592)Rebasing (536/592)Rebasing (537/592)Rebasing (538/592)Rebasing (539/592)Rebasing (540/592)Rebasing (541/592)Rebasing (542/592)Rebasing (543/592)Rebasing (544/592)Rebasing (545/592)Rebasing (546/592)Rebasing (547/592)Rebasing (548/592)Rebasing (549/592)Rebasing (550/592)Rebasing (551/592)Rebasing (552/592)Rebasing (553/592)Rebasing (554/592)Rebasing (555/592)Rebasing (556/592)Rebasing (557/592)Rebasing (558/592)Rebasing (559/592)Rebasing (560/592)Rebasing (561/592)Rebasing (562/592)Rebasing (563/592)Rebasing (564/592)Rebasing (565/592)Rebasing (566/592)Rebasing (567/592)Rebasing (568/592)Rebasing (569/592)Rebasing (570/592)Rebasing (571/592)Rebasing (572/592)Rebasing (573/592)Rebasing (574/592)Rebasing (575/592)Rebasing (576/592)Rebasing (577/592)Rebasing (578/592)Rebasing (579/592)Rebasing (580/592)Rebasing (581/592)Rebasing (582/592)Rebasing (583/592)Rebasing (584/592)Rebasing (585/592)Rebasing (586/592)Rebasing (587/592)Rebasing (588/592)Rebasing (589/592)Rebasing (590/592)Rebasing (591/592)Rebasing (592/592)                                                                                Successfully rebased and updated refs/heads/claude/code-review-improvements-ikvuj.
e111e1b4 chore: snapshot production state 2026-08-29 09:00
extracteur : 2026-08-19 17:46:50
annees rejouees : 2026 2025 2024 2023 2022

==============================================
 1. REJEU DE L EXTRACTION
==============================================
CSV de rejeu existant, 12 h — reutilise sans reextraction.
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

Contrat d ecriture:            mode warn, lot SECNG_20260829_095934
  Qualite des mesures:         (aucune)
  Mesures refusees:            0
  Rollback de ce lot:          DELETE FROM valorisations WHERE correction_batch = 'SECNG_20260829_095934'

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
Mesure le 2026-08-29 09:59:37 UTC — LECTURE SEULE
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
Mesure le 2026-08-29 09:59:42 UTC — LECTURE SEULE
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
