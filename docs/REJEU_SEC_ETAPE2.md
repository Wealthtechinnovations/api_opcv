# Rejeu SEC — etape 2, phase seche

> Genere par `ops-sec-replay-dryrun.yml`. Ne pas modifier a la main.
> **Aucune ecriture en base** : extraction dans un fichier dedie, import en dry-run.

Derniere execution : **2026-08-29 00:20 UTC**

```
==============================================
 0. MISE A JOUR ET VERSION DU CODE
==============================================
 * branch              claude/code-review-improvements-ikvuj -> FETCH_HEAD
   df5cfcb3..842f69c2  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Rebasing (1/583)Rebasing (2/583)Rebasing (3/583)Rebasing (4/583)Rebasing (5/583)Rebasing (6/583)Rebasing (7/583)Rebasing (8/583)Rebasing (9/583)Rebasing (10/583)Rebasing (11/583)Rebasing (12/583)Rebasing (13/583)Rebasing (14/583)Rebasing (15/583)Rebasing (16/583)Rebasing (17/583)Rebasing (18/583)Rebasing (19/583)Rebasing (20/583)Rebasing (21/583)Rebasing (22/583)Rebasing (23/583)Rebasing (24/583)Rebasing (25/583)Rebasing (26/583)Rebasing (27/583)Rebasing (28/583)Rebasing (29/583)Rebasing (30/583)Rebasing (31/583)Rebasing (32/583)Rebasing (33/583)Rebasing (34/583)Rebasing (35/583)Rebasing (36/583)Rebasing (37/583)Rebasing (38/583)Rebasing (39/583)Rebasing (40/583)Rebasing (41/583)Rebasing (42/583)Rebasing (43/583)Rebasing (44/583)Rebasing (45/583)Rebasing (46/583)Rebasing (47/583)Rebasing (48/583)Rebasing (49/583)Rebasing (50/583)Rebasing (51/583)Rebasing (52/583)Rebasing (53/583)Rebasing (54/583)Rebasing (55/583)Rebasing (56/583)Rebasing (57/583)Rebasing (58/583)Rebasing (59/583)Rebasing (60/583)Rebasing (61/583)Rebasing (62/583)Rebasing (63/583)Rebasing (64/583)Rebasing (65/583)Rebasing (66/583)Rebasing (67/583)Rebasing (68/583)Rebasing (69/583)Rebasing (70/583)Rebasing (71/583)Rebasing (72/583)Rebasing (73/583)Rebasing (74/583)Rebasing (75/583)Rebasing (76/583)Rebasing (77/583)Rebasing (78/583)Rebasing (79/583)Rebasing (80/583)Rebasing (81/583)Rebasing (82/583)Rebasing (83/583)Rebasing (84/583)Rebasing (85/583)Rebasing (86/583)Rebasing (87/583)Rebasing (88/583)Rebasing (89/583)Rebasing (90/583)Rebasing (91/583)Rebasing (92/583)Rebasing (93/583)Rebasing (94/583)Rebasing (95/583)Rebasing (96/583)Rebasing (97/583)Rebasing (98/583)Rebasing (99/583)Rebasing (100/583)Rebasing (101/583)Rebasing (102/583)Rebasing (103/583)Rebasing (104/583)Rebasing (105/583)Rebasing (106/583)Rebasing (107/583)Rebasing (108/583)Rebasing (109/583)Rebasing (110/583)Rebasing (111/583)Rebasing (112/583)Rebasing (113/583)Rebasing (114/583)Rebasing (115/583)Rebasing (116/583)Rebasing (117/583)Rebasing (118/583)Rebasing (119/583)Rebasing (120/583)Rebasing (121/583)Rebasing (122/583)Rebasing (123/583)Rebasing (124/583)Rebasing (125/583)Rebasing (126/583)Rebasing (127/583)Rebasing (128/583)Rebasing (129/583)Rebasing (130/583)Rebasing (131/583)Rebasing (132/583)Rebasing (133/583)Rebasing (134/583)Rebasing (135/583)Rebasing (136/583)Rebasing (137/583)Rebasing (138/583)Rebasing (139/583)Rebasing (140/583)Rebasing (141/583)Rebasing (142/583)Rebasing (143/583)Rebasing (144/583)Rebasing (145/583)Rebasing (146/583)Rebasing (147/583)Rebasing (148/583)Rebasing (149/583)Rebasing (150/583)Rebasing (151/583)Rebasing (152/583)Rebasing (153/583)Rebasing (154/583)Rebasing (155/583)Rebasing (156/583)Rebasing (157/583)Rebasing (158/583)Rebasing (159/583)Rebasing (160/583)Rebasing (161/583)Rebasing (162/583)Rebasing (163/583)Rebasing (164/583)Rebasing (165/583)Rebasing (166/583)Rebasing (167/583)Rebasing (168/583)Rebasing (169/583)Rebasing (170/583)Rebasing (171/583)Rebasing (172/583)Rebasing (173/583)Rebasing (174/583)Rebasing (175/583)Rebasing (176/583)Rebasing (177/583)Rebasing (178/583)Rebasing (179/583)Rebasing (180/583)Rebasing (181/583)Rebasing (182/583)Rebasing (183/583)Rebasing (184/583)Rebasing (185/583)Rebasing (186/583)Rebasing (187/583)Rebasing (188/583)Rebasing (189/583)Rebasing (190/583)Rebasing (191/583)Rebasing (192/583)Rebasing (193/583)Rebasing (194/583)Rebasing (195/583)Rebasing (196/583)Rebasing (197/583)Rebasing (198/583)Rebasing (199/583)Rebasing (200/583)Rebasing (201/583)Rebasing (202/583)Rebasing (203/583)Rebasing (204/583)Rebasing (205/583)Rebasing (206/583)Rebasing (207/583)Rebasing (208/583)Rebasing (209/583)Rebasing (210/583)Rebasing (211/583)Rebasing (212/583)Rebasing (213/583)Rebasing (214/583)Rebasing (215/583)Rebasing (216/583)Rebasing (217/583)Rebasing (218/583)Rebasing (219/583)Rebasing (220/583)Rebasing (221/583)Rebasing (222/583)Rebasing (223/583)Rebasing (224/583)Rebasing (225/583)Rebasing (226/583)Rebasing (227/583)Rebasing (228/583)Rebasing (229/583)Rebasing (230/583)Rebasing (231/583)Rebasing (232/583)Rebasing (233/583)Rebasing (234/583)Rebasing (235/583)Rebasing (236/583)Rebasing (237/583)Rebasing (238/583)Rebasing (239/583)Rebasing (240/583)Rebasing (241/583)Rebasing (242/583)Rebasing (243/583)Rebasing (244/583)Rebasing (245/583)Rebasing (246/583)Rebasing (247/583)Rebasing (248/583)Rebasing (249/583)Rebasing (250/583)Rebasing (251/583)Rebasing (252/583)Rebasing (253/583)Rebasing (254/583)Rebasing (255/583)Rebasing (256/583)Rebasing (257/583)Rebasing (258/583)Rebasing (259/583)Rebasing (260/583)Rebasing (261/583)Rebasing (262/583)Rebasing (263/583)Rebasing (264/583)Rebasing (265/583)Rebasing (266/583)Rebasing (267/583)Rebasing (268/583)Rebasing (269/583)Rebasing (270/583)Rebasing (271/583)Rebasing (272/583)Rebasing (273/583)Rebasing (274/583)Rebasing (275/583)Rebasing (276/583)Rebasing (277/583)Rebasing (278/583)Rebasing (279/583)Rebasing (280/583)Rebasing (281/583)Rebasing (282/583)Rebasing (283/583)Rebasing (284/583)Rebasing (285/583)Rebasing (286/583)Rebasing (287/583)Rebasing (288/583)Rebasing (289/583)Rebasing (290/583)Rebasing (291/583)Rebasing (292/583)Rebasing (293/583)Rebasing (294/583)Rebasing (295/583)Rebasing (296/583)Rebasing (297/583)Rebasing (298/583)Rebasing (299/583)Rebasing (300/583)Rebasing (301/583)Rebasing (302/583)Rebasing (303/583)Rebasing (304/583)Rebasing (305/583)Rebasing (306/583)Rebasing (307/583)Rebasing (308/583)Rebasing (309/583)Rebasing (310/583)Rebasing (311/583)Rebasing (312/583)Rebasing (313/583)Rebasing (314/583)Rebasing (315/583)Rebasing (316/583)Rebasing (317/583)Rebasing (318/583)Rebasing (319/583)Rebasing (320/583)Rebasing (321/583)Rebasing (322/583)Rebasing (323/583)Rebasing (324/583)Rebasing (325/583)Rebasing (326/583)Rebasing (327/583)Rebasing (328/583)Rebasing (329/583)Rebasing (330/583)Rebasing (331/583)Rebasing (332/583)Rebasing (333/583)Rebasing (334/583)Rebasing (335/583)Rebasing (336/583)Rebasing (337/583)Rebasing (338/583)Rebasing (339/583)Rebasing (340/583)Rebasing (341/583)Rebasing (342/583)Rebasing (343/583)Rebasing (344/583)Rebasing (345/583)Rebasing (346/583)Rebasing (347/583)Rebasing (348/583)Rebasing (349/583)Rebasing (350/583)Rebasing (351/583)Rebasing (352/583)Rebasing (353/583)Rebasing (354/583)Rebasing (355/583)Rebasing (356/583)Rebasing (357/583)Rebasing (358/583)Rebasing (359/583)Rebasing (360/583)Rebasing (361/583)Rebasing (362/583)Rebasing (363/583)Rebasing (364/583)Rebasing (365/583)Rebasing (366/583)Rebasing (367/583)Rebasing (368/583)Rebasing (369/583)Rebasing (370/583)Rebasing (371/583)Rebasing (372/583)Rebasing (373/583)Rebasing (374/583)Rebasing (375/583)Rebasing (376/583)Rebasing (377/583)Rebasing (378/583)Rebasing (379/583)Rebasing (380/583)Rebasing (381/583)Rebasing (382/583)Rebasing (383/583)Rebasing (384/583)Rebasing (385/583)Rebasing (386/583)Rebasing (387/583)Rebasing (388/583)Rebasing (389/583)Rebasing (390/583)Rebasing (391/583)Rebasing (392/583)Rebasing (393/583)Rebasing (394/583)Rebasing (395/583)Rebasing (396/583)Rebasing (397/583)Rebasing (398/583)Rebasing (399/583)Rebasing (400/583)Rebasing (401/583)Rebasing (402/583)Rebasing (403/583)Rebasing (404/583)Rebasing (405/583)Rebasing (406/583)Rebasing (407/583)Rebasing (408/583)Rebasing (409/583)Rebasing (410/583)Rebasing (411/583)Rebasing (412/583)Rebasing (413/583)Rebasing (414/583)Rebasing (415/583)Rebasing (416/583)Rebasing (417/583)Rebasing (418/583)Rebasing (419/583)Rebasing (420/583)Rebasing (421/583)Rebasing (422/583)Rebasing (423/583)Rebasing (424/583)Rebasing (425/583)Rebasing (426/583)Rebasing (427/583)Rebasing (428/583)Rebasing (429/583)Rebasing (430/583)Rebasing (431/583)Rebasing (432/583)Rebasing (433/583)Rebasing (434/583)Rebasing (435/583)Rebasing (436/583)Rebasing (437/583)Rebasing (438/583)Rebasing (439/583)Rebasing (440/583)Rebasing (441/583)Rebasing (442/583)Rebasing (443/583)Rebasing (444/583)Rebasing (445/583)Rebasing (446/583)Rebasing (447/583)Rebasing (448/583)Rebasing (449/583)Rebasing (450/583)Rebasing (451/583)Rebasing (452/583)Rebasing (453/583)Rebasing (454/583)Rebasing (455/583)Rebasing (456/583)Rebasing (457/583)Rebasing (458/583)Rebasing (459/583)Rebasing (460/583)Rebasing (461/583)Rebasing (462/583)Rebasing (463/583)Rebasing (464/583)Rebasing (465/583)Rebasing (466/583)Rebasing (467/583)Rebasing (468/583)Rebasing (469/583)Rebasing (470/583)Rebasing (471/583)Rebasing (472/583)Rebasing (473/583)Rebasing (474/583)Rebasing (475/583)Rebasing (476/583)Rebasing (477/583)Rebasing (478/583)Rebasing (479/583)Rebasing (480/583)Rebasing (481/583)Rebasing (482/583)Rebasing (483/583)Rebasing (484/583)Rebasing (485/583)Rebasing (486/583)Rebasing (487/583)Rebasing (488/583)Rebasing (489/583)Rebasing (490/583)Rebasing (491/583)Rebasing (492/583)Rebasing (493/583)Rebasing (494/583)Rebasing (495/583)Rebasing (496/583)Rebasing (497/583)Rebasing (498/583)Rebasing (499/583)Rebasing (500/583)Rebasing (501/583)Rebasing (502/583)Rebasing (503/583)Rebasing (504/583)Rebasing (505/583)Rebasing (506/583)Rebasing (507/583)Rebasing (508/583)Rebasing (509/583)Rebasing (510/583)Rebasing (511/583)Rebasing (512/583)Rebasing (513/583)Rebasing (514/583)Rebasing (515/583)Rebasing (516/583)Rebasing (517/583)Rebasing (518/583)Rebasing (519/583)Rebasing (520/583)Rebasing (521/583)Rebasing (522/583)Rebasing (523/583)Rebasing (524/583)Rebasing (525/583)Rebasing (526/583)Rebasing (527/583)Rebasing (528/583)Rebasing (529/583)Rebasing (530/583)Rebasing (531/583)Rebasing (532/583)Rebasing (533/583)Rebasing (534/583)Rebasing (535/583)Rebasing (536/583)Rebasing (537/583)Rebasing (538/583)Rebasing (539/583)Rebasing (540/583)Rebasing (541/583)Rebasing (542/583)Rebasing (543/583)Rebasing (544/583)Rebasing (545/583)Rebasing (546/583)Rebasing (547/583)Rebasing (548/583)Rebasing (549/583)Rebasing (550/583)Rebasing (551/583)Rebasing (552/583)Rebasing (553/583)Rebasing (554/583)Rebasing (555/583)Rebasing (556/583)Rebasing (557/583)Rebasing (558/583)Rebasing (559/583)Rebasing (560/583)Rebasing (561/583)Rebasing (562/583)Rebasing (563/583)Rebasing (564/583)Rebasing (565/583)Rebasing (566/583)Rebasing (567/583)Rebasing (568/583)Rebasing (569/583)Rebasing (570/583)Rebasing (571/583)Rebasing (572/583)Rebasing (573/583)Rebasing (574/583)Rebasing (575/583)Rebasing (576/583)Rebasing (577/583)Rebasing (578/583)Rebasing (579/583)Rebasing (580/583)Rebasing (581/583)Rebasing (582/583)Rebasing (583/583)                                                                                Successfully rebased and updated refs/heads/claude/code-review-improvements-ikvuj.
27c06284 chore: snapshot production state 2026-08-29 00:00
extracteur : 2026-08-19 17:46:50
annees rejouees : 2026 2025 2024 2023 2022

==============================================
 1. REJEU DE L EXTRACTION
==============================================
CSV de rejeu existant, 3 h — reutilise sans reextraction.
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

Contrat d ecriture:            mode warn, lot SECNG_20260829_002001
  Qualite des mesures:         (aucune)
  Mesures refusees:            0
  Rollback de ce lot:          DELETE FROM valorisations WHERE correction_batch = 'SECNG_20260829_002001'

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
Mesure le 2026-08-29 00:20:05 UTC — LECTURE SEULE
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
Mesure le 2026-08-29 00:20:10 UTC — LECTURE SEULE
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
