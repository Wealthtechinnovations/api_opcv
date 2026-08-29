# Rejeu SEC — etape 2, phase seche

> Genere par `ops-sec-replay-dryrun.yml`. Ne pas modifier a la main.
> **Aucune ecriture en base** : extraction dans un fichier dedie, import en dry-run.

Derniere execution : **2026-08-29 04:59 UTC**

```
==============================================
 0. MISE A JOUR ET VERSION DU CODE
==============================================
 * branch              claude/code-review-improvements-ikvuj -> FETCH_HEAD
   472c25b0..2d47315c  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Rebasing (1/587)Rebasing (2/587)Rebasing (3/587)Rebasing (4/587)Rebasing (5/587)Rebasing (6/587)Rebasing (7/587)Rebasing (8/587)Rebasing (9/587)Rebasing (10/587)Rebasing (11/587)Rebasing (12/587)Rebasing (13/587)Rebasing (14/587)Rebasing (15/587)Rebasing (16/587)Rebasing (17/587)Rebasing (18/587)Rebasing (19/587)Rebasing (20/587)Rebasing (21/587)Rebasing (22/587)Rebasing (23/587)Rebasing (24/587)Rebasing (25/587)Rebasing (26/587)Rebasing (27/587)Rebasing (28/587)Rebasing (29/587)Rebasing (30/587)Rebasing (31/587)Rebasing (32/587)Rebasing (33/587)Rebasing (34/587)Rebasing (35/587)Rebasing (36/587)Rebasing (37/587)Rebasing (38/587)Rebasing (39/587)Rebasing (40/587)Rebasing (41/587)Rebasing (42/587)Rebasing (43/587)Rebasing (44/587)Rebasing (45/587)Rebasing (46/587)Rebasing (47/587)Rebasing (48/587)Rebasing (49/587)Rebasing (50/587)Rebasing (51/587)Rebasing (52/587)Rebasing (53/587)Rebasing (54/587)Rebasing (55/587)Rebasing (56/587)Rebasing (57/587)Rebasing (58/587)Rebasing (59/587)Rebasing (60/587)Rebasing (61/587)Rebasing (62/587)Rebasing (63/587)Rebasing (64/587)Rebasing (65/587)Rebasing (66/587)Rebasing (67/587)Rebasing (68/587)Rebasing (69/587)Rebasing (70/587)Rebasing (71/587)Rebasing (72/587)Rebasing (73/587)Rebasing (74/587)Rebasing (75/587)Rebasing (76/587)Rebasing (77/587)Rebasing (78/587)Rebasing (79/587)Rebasing (80/587)Rebasing (81/587)Rebasing (82/587)Rebasing (83/587)Rebasing (84/587)Rebasing (85/587)Rebasing (86/587)Rebasing (87/587)Rebasing (88/587)Rebasing (89/587)Rebasing (90/587)Rebasing (91/587)Rebasing (92/587)Rebasing (93/587)Rebasing (94/587)Rebasing (95/587)Rebasing (96/587)Rebasing (97/587)Rebasing (98/587)Rebasing (99/587)Rebasing (100/587)Rebasing (101/587)Rebasing (102/587)Rebasing (103/587)Rebasing (104/587)Rebasing (105/587)Rebasing (106/587)Rebasing (107/587)Rebasing (108/587)Rebasing (109/587)Rebasing (110/587)Rebasing (111/587)Rebasing (112/587)Rebasing (113/587)Rebasing (114/587)Rebasing (115/587)Rebasing (116/587)Rebasing (117/587)Rebasing (118/587)Rebasing (119/587)Rebasing (120/587)Rebasing (121/587)Rebasing (122/587)Rebasing (123/587)Rebasing (124/587)Rebasing (125/587)Rebasing (126/587)Rebasing (127/587)Rebasing (128/587)Rebasing (129/587)Rebasing (130/587)Rebasing (131/587)Rebasing (132/587)Rebasing (133/587)Rebasing (134/587)Rebasing (135/587)Rebasing (136/587)Rebasing (137/587)Rebasing (138/587)Rebasing (139/587)Rebasing (140/587)Rebasing (141/587)Rebasing (142/587)Rebasing (143/587)Rebasing (144/587)Rebasing (145/587)Rebasing (146/587)Rebasing (147/587)Rebasing (148/587)Rebasing (149/587)Rebasing (150/587)Rebasing (151/587)Rebasing (152/587)Rebasing (153/587)Rebasing (154/587)Rebasing (155/587)Rebasing (156/587)Rebasing (157/587)Rebasing (158/587)Rebasing (159/587)Rebasing (160/587)Rebasing (161/587)Rebasing (162/587)Rebasing (163/587)Rebasing (164/587)Rebasing (165/587)Rebasing (166/587)Rebasing (167/587)Rebasing (168/587)Rebasing (169/587)Rebasing (170/587)Rebasing (171/587)Rebasing (172/587)Rebasing (173/587)Rebasing (174/587)Rebasing (175/587)Rebasing (176/587)Rebasing (177/587)Rebasing (178/587)Rebasing (179/587)Rebasing (180/587)Rebasing (181/587)Rebasing (182/587)Rebasing (183/587)Rebasing (184/587)Rebasing (185/587)Rebasing (186/587)Rebasing (187/587)Rebasing (188/587)Rebasing (189/587)Rebasing (190/587)Rebasing (191/587)Rebasing (192/587)Rebasing (193/587)Rebasing (194/587)Rebasing (195/587)Rebasing (196/587)Rebasing (197/587)Rebasing (198/587)Rebasing (199/587)Rebasing (200/587)Rebasing (201/587)Rebasing (202/587)Rebasing (203/587)Rebasing (204/587)Rebasing (205/587)Rebasing (206/587)Rebasing (207/587)Rebasing (208/587)Rebasing (209/587)Rebasing (210/587)Rebasing (211/587)Rebasing (212/587)Rebasing (213/587)Rebasing (214/587)Rebasing (215/587)Rebasing (216/587)Rebasing (217/587)Rebasing (218/587)Rebasing (219/587)Rebasing (220/587)Rebasing (221/587)Rebasing (222/587)Rebasing (223/587)Rebasing (224/587)Rebasing (225/587)Rebasing (226/587)Rebasing (227/587)Rebasing (228/587)Rebasing (229/587)Rebasing (230/587)Rebasing (231/587)Rebasing (232/587)Rebasing (233/587)Rebasing (234/587)Rebasing (235/587)Rebasing (236/587)Rebasing (237/587)Rebasing (238/587)Rebasing (239/587)Rebasing (240/587)Rebasing (241/587)Rebasing (242/587)Rebasing (243/587)Rebasing (244/587)Rebasing (245/587)Rebasing (246/587)Rebasing (247/587)Rebasing (248/587)Rebasing (249/587)Rebasing (250/587)Rebasing (251/587)Rebasing (252/587)Rebasing (253/587)Rebasing (254/587)Rebasing (255/587)Rebasing (256/587)Rebasing (257/587)Rebasing (258/587)Rebasing (259/587)Rebasing (260/587)Rebasing (261/587)Rebasing (262/587)Rebasing (263/587)Rebasing (264/587)Rebasing (265/587)Rebasing (266/587)Rebasing (267/587)Rebasing (268/587)Rebasing (269/587)Rebasing (270/587)Rebasing (271/587)Rebasing (272/587)Rebasing (273/587)Rebasing (274/587)Rebasing (275/587)Rebasing (276/587)Rebasing (277/587)Rebasing (278/587)Rebasing (279/587)Rebasing (280/587)Rebasing (281/587)Rebasing (282/587)Rebasing (283/587)Rebasing (284/587)Rebasing (285/587)Rebasing (286/587)Rebasing (287/587)Rebasing (288/587)Rebasing (289/587)Rebasing (290/587)Rebasing (291/587)Rebasing (292/587)Rebasing (293/587)Rebasing (294/587)Rebasing (295/587)Rebasing (296/587)Rebasing (297/587)Rebasing (298/587)Rebasing (299/587)Rebasing (300/587)Rebasing (301/587)Rebasing (302/587)Rebasing (303/587)Rebasing (304/587)Rebasing (305/587)Rebasing (306/587)Rebasing (307/587)Rebasing (308/587)Rebasing (309/587)Rebasing (310/587)Rebasing (311/587)Rebasing (312/587)Rebasing (313/587)Rebasing (314/587)Rebasing (315/587)Rebasing (316/587)Rebasing (317/587)Rebasing (318/587)Rebasing (319/587)Rebasing (320/587)Rebasing (321/587)Rebasing (322/587)Rebasing (323/587)Rebasing (324/587)Rebasing (325/587)Rebasing (326/587)Rebasing (327/587)Rebasing (328/587)Rebasing (329/587)Rebasing (330/587)Rebasing (331/587)Rebasing (332/587)Rebasing (333/587)Rebasing (334/587)Rebasing (335/587)Rebasing (336/587)Rebasing (337/587)Rebasing (338/587)Rebasing (339/587)Rebasing (340/587)Rebasing (341/587)Rebasing (342/587)Rebasing (343/587)Rebasing (344/587)Rebasing (345/587)Rebasing (346/587)Rebasing (347/587)Rebasing (348/587)Rebasing (349/587)Rebasing (350/587)Rebasing (351/587)Rebasing (352/587)Rebasing (353/587)Rebasing (354/587)Rebasing (355/587)Rebasing (356/587)Rebasing (357/587)Rebasing (358/587)Rebasing (359/587)Rebasing (360/587)Rebasing (361/587)Rebasing (362/587)Rebasing (363/587)Rebasing (364/587)Rebasing (365/587)Rebasing (366/587)Rebasing (367/587)Rebasing (368/587)Rebasing (369/587)Rebasing (370/587)Rebasing (371/587)Rebasing (372/587)Rebasing (373/587)Rebasing (374/587)Rebasing (375/587)Rebasing (376/587)Rebasing (377/587)Rebasing (378/587)Rebasing (379/587)Rebasing (380/587)Rebasing (381/587)Rebasing (382/587)Rebasing (383/587)Rebasing (384/587)Rebasing (385/587)Rebasing (386/587)Rebasing (387/587)Rebasing (388/587)Rebasing (389/587)Rebasing (390/587)Rebasing (391/587)Rebasing (392/587)Rebasing (393/587)Rebasing (394/587)Rebasing (395/587)Rebasing (396/587)Rebasing (397/587)Rebasing (398/587)Rebasing (399/587)Rebasing (400/587)Rebasing (401/587)Rebasing (402/587)Rebasing (403/587)Rebasing (404/587)Rebasing (405/587)Rebasing (406/587)Rebasing (407/587)Rebasing (408/587)Rebasing (409/587)Rebasing (410/587)Rebasing (411/587)Rebasing (412/587)Rebasing (413/587)Rebasing (414/587)Rebasing (415/587)Rebasing (416/587)Rebasing (417/587)Rebasing (418/587)Rebasing (419/587)Rebasing (420/587)Rebasing (421/587)Rebasing (422/587)Rebasing (423/587)Rebasing (424/587)Rebasing (425/587)Rebasing (426/587)Rebasing (427/587)Rebasing (428/587)Rebasing (429/587)Rebasing (430/587)Rebasing (431/587)Rebasing (432/587)Rebasing (433/587)Rebasing (434/587)Rebasing (435/587)Rebasing (436/587)Rebasing (437/587)Rebasing (438/587)Rebasing (439/587)Rebasing (440/587)Rebasing (441/587)Rebasing (442/587)Rebasing (443/587)Rebasing (444/587)Rebasing (445/587)Rebasing (446/587)Rebasing (447/587)Rebasing (448/587)Rebasing (449/587)Rebasing (450/587)Rebasing (451/587)Rebasing (452/587)Rebasing (453/587)Rebasing (454/587)Rebasing (455/587)Rebasing (456/587)Rebasing (457/587)Rebasing (458/587)Rebasing (459/587)Rebasing (460/587)Rebasing (461/587)Rebasing (462/587)Rebasing (463/587)Rebasing (464/587)Rebasing (465/587)Rebasing (466/587)Rebasing (467/587)Rebasing (468/587)Rebasing (469/587)Rebasing (470/587)Rebasing (471/587)Rebasing (472/587)Rebasing (473/587)Rebasing (474/587)Rebasing (475/587)Rebasing (476/587)Rebasing (477/587)Rebasing (478/587)Rebasing (479/587)Rebasing (480/587)Rebasing (481/587)Rebasing (482/587)Rebasing (483/587)Rebasing (484/587)Rebasing (485/587)Rebasing (486/587)Rebasing (487/587)Rebasing (488/587)Rebasing (489/587)Rebasing (490/587)Rebasing (491/587)Rebasing (492/587)Rebasing (493/587)Rebasing (494/587)Rebasing (495/587)Rebasing (496/587)Rebasing (497/587)Rebasing (498/587)Rebasing (499/587)Rebasing (500/587)Rebasing (501/587)Rebasing (502/587)Rebasing (503/587)Rebasing (504/587)Rebasing (505/587)Rebasing (506/587)Rebasing (507/587)Rebasing (508/587)Rebasing (509/587)Rebasing (510/587)Rebasing (511/587)Rebasing (512/587)Rebasing (513/587)Rebasing (514/587)Rebasing (515/587)Rebasing (516/587)Rebasing (517/587)Rebasing (518/587)Rebasing (519/587)Rebasing (520/587)Rebasing (521/587)Rebasing (522/587)Rebasing (523/587)Rebasing (524/587)Rebasing (525/587)Rebasing (526/587)Rebasing (527/587)Rebasing (528/587)Rebasing (529/587)Rebasing (530/587)Rebasing (531/587)Rebasing (532/587)Rebasing (533/587)Rebasing (534/587)Rebasing (535/587)Rebasing (536/587)Rebasing (537/587)Rebasing (538/587)Rebasing (539/587)Rebasing (540/587)Rebasing (541/587)Rebasing (542/587)Rebasing (543/587)Rebasing (544/587)Rebasing (545/587)Rebasing (546/587)Rebasing (547/587)Rebasing (548/587)Rebasing (549/587)Rebasing (550/587)Rebasing (551/587)Rebasing (552/587)Rebasing (553/587)Rebasing (554/587)Rebasing (555/587)Rebasing (556/587)Rebasing (557/587)Rebasing (558/587)Rebasing (559/587)Rebasing (560/587)Rebasing (561/587)Rebasing (562/587)Rebasing (563/587)Rebasing (564/587)Rebasing (565/587)Rebasing (566/587)Rebasing (567/587)Rebasing (568/587)Rebasing (569/587)Rebasing (570/587)Rebasing (571/587)Rebasing (572/587)Rebasing (573/587)Rebasing (574/587)Rebasing (575/587)Rebasing (576/587)Rebasing (577/587)Rebasing (578/587)Rebasing (579/587)Rebasing (580/587)Rebasing (581/587)Rebasing (582/587)Rebasing (583/587)Rebasing (584/587)Rebasing (585/587)Rebasing (586/587)Rebasing (587/587)                                                                                Successfully rebased and updated refs/heads/claude/code-review-improvements-ikvuj.
227f1ce6 chore: snapshot production state 2026-08-29 04:00
extracteur : 2026-08-19 17:46:50
annees rejouees : 2026 2025 2024 2023 2022

==============================================
 1. REJEU DE L EXTRACTION
==============================================
CSV de rejeu existant, 7 h — reutilise sans reextraction.
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

=== EN-TETES SEC — 340 fichiers sous sec_ng_downloads ===

  annee   fichiers  avec ($)  avec (N)  illisibles   part dollar
  ------ --------- --------- --------- -----------   -----------
  2020          49         0         0           0   0.0 %
  2021          52         0         6           0   0.0 %
  2022          51         0        51           0   0.0 %
  2023          52         0        52           0   0.0 %
  2024          52         0        52           0   0.0 %
  2025          51         0        51           0   0.0 %
  2026          33        16        33           0   48.5 %

  Total : 16 fichier(s) sur 340 portent au moins un en-tete en dollars.

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

Contrat d ecriture:            mode warn, lot SECNG_20260829_045911
  Qualite des mesures:         (aucune)
  Mesures refusees:            0
  Rollback de ce lot:          DELETE FROM valorisations WHERE correction_batch = 'SECNG_20260829_045911'

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
Mesure le 2026-08-29 04:59:14 UTC — LECTURE SEULE
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
Mesure le 2026-08-29 04:59:19 UTC — LECTURE SEULE
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
