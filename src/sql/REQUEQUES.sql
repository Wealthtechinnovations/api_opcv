UPDATE valorisations as v inner join indice_references as i on v.ID_indice=i.id_indice and v.date=i.date set indRef=i.valeur;


UPDATE valorisations AS t1
JOIN (
    SELECT MIN(date) AS date_initiale, `value` AS vl_initiale
    FROM valorisations
) AS t2
SET t1.base_100 = (t1.value / t2.vl_initiale) * 100
WHERE t1.date > t2.date_initiale;


UPDATE valorisations AS t1
JOIN (
    SELECT MIN(date) AS date_initiale, `value` AS vl_initiale
    FROM valorisations where `fund_id`=3
) AS t2
SET t1.base_100 = (t1.value / t2.vl_initiale) * 100
WHERE t1.date > t2.date_initiale and `fund_id`=3;

UPDATE valorisations AS t1
JOIN (
    SELECT MIN(date) AS date_initiale, `indRef` AS vl_initiale
    FROM valorisations where `fund_id`=581
) AS t2
SET t1.base_100_InRef = (t1.indRef / t2.vl_initiale) * 100
WHERE t1.date > t2.date_initiale and `fund_id`=581;




//last date
UPDATE fond_investissements AS f
INNER JOIN (
    SELECT v.fund_id, MAX(v.date) AS derniere_date_valeur
    FROM valorisations AS v
    GROUP BY v.fund_id
) AS subq ON f.id = subq.fund_id
SET f.datejour = subq.derniere_date_valeur;

CREATE INDEX idx_valorisations_date ON valorisations(date);
CREATE INDEX idx_valorisations_id_indice ON valorisations(ID_indice);
CREATE INDEX idx_valorisations_fund_id ON valorisations(fund_id);
CREATE INDEX idx_indice_references_date ON indice_references(date);
CREATE INDEX idx_indice_references_id_indice ON indice_references(id_indice);

//mettre a jour nom fund
//mettre a jour nom indice
UPDATE valorisations v inner join indice_references i on v.ID_indice=i.id_indice set v.indice_name=i.nom_indice
//mettre a jour indice obloigation
UPDATE valorisations v
INNER JOIN fond_investissements i ON v.fund_id = i.id and i.categorie_globale="Obligations" SET ID_indice='Sovereign_bond_index'
//Set indice indRef
update valorisations set ID_indice="masi_all_shares" where id>11315;
UPDATE valorisations v
JOIN indice_references i ON v.date = i.date and v.ID_indice=i.id_indice 
SET v.indRef = i.valeur where v.id>11315
SELECT * FROM valorisations v inner join indice_references i ON v.date = i.date and v.ID_indice=i.id_indice


//SET DEVISE 
UPDATE fond_investissements v
JOIN pays_regulateurs i ON v.pays = i.pays  
SET v.dev_libelle = i.symboledevise 

UPDATE valorisations v
INNER JOIN fond_investissements i ON v.fund_id = i.id  
JOIN devisedechanges d ON v.date = d.date and d.paire='EUR/i.dev_libelle' 
SET v.value_EUR = CAST(v.value/d.value AS DOUBLE) 


UPDATE valorisations v
INNER JOIN fond_investissements i ON v.fund_id = i.id  
JOIN devisedechanges d ON v.date = d.date and d.paire='USD' 
SET v.value_USD = CAST(v.value/d.value AS DOUBLE) 
WHERE i.dev_libelle='MAD'


UPDATE valorisations v
INNER JOIN fond_investissements i ON v.fund_id = i.id  
JOIN devisedechanges d ON v.date = d.date and d.test='EURMAD' 
SET v.value_EUR = CAST(v.value/d.value AS DOUBLE) 
WHERE i.dev_libelle='MAD'

//vl null
UPDATE valorisations v
LEFT JOIN devisedechanges d ON v.date = d.date AND d.test = 'USDXOF'
INNER JOIN fond_investissements i ON v.fund_id = i.id
SET v.indRef_USD = NULL
WHERE i.dev_libelle = 'FCFA'
AND d.date IS NULL;


SHOW PROCESSLIST
KILL 936;

///////////////////

 UPDATE valorisations v
JOIN fond_investissements f ON v.fund_id = f.id
SET v.ID_indice = 'Sovereign_bond_index', v.indice_name = 'Sovereign_bond_index'
WHERE f.categorie_globale = 'Obligations' and f.pays="Maroc"
 
 UPDATE valorisations v JOIN fond_investissements f ON v.fund_id = f.id SET v.ID_indice = 'Sovereign_bond_index', v.indice_name = 'Sovereign_bond_index' WHERE f.categorie_globale = 'Obligations' and f.pays="Maroc";
 
 UPDATE valorisations v
JOIN indice_references f ON v.ID_indice = f.id_indice and v.date=f.date
SET v.indRef = f.valeur
WHERE f.id_indice ='Sovereign_bond_index'  //masi_all_shares  159.12
UPDATE valorisations v
JOIN indice_references f ON v.ID_indice = f.id_indice 
SET v.indRef = 159.12 113.989
WHERE f.id_indice ='Sovereign_bond_index' and v.indRef is null;

UPDATE valorisations v
SET v.indRef = 159.12
WHERE v.fund_id=1114 and v.indRef is null;


UPDATE valorisations v
JOIN indice_references f ON v.ID_indice = f.id_indice 
SET v.indRef =113.989
WHERE f.id_indice ='masi_all_shares' and v.indRef is null;


////value precedent
UPDATE valorisations v1
SET indRef = (
    SELECT v2.indRef
    FROM valorisations v2
    WHERE v2.id < v1.id AND v2.indRef IS NOT NULL and v2.fund_id=v1.fund_id
    ORDER BY v2.id DESC
    LIMIT 1
)
WHERE v1.indRef IS NULL;

UPDATE valorisations v1 SET indRef_USD = ( SELECT v2.indRef_USD FROM valorisations v2 WHERE v2.id < v1.id AND v2.indRef_USD IS NOT NULL AND v2.fund_id=v1.fund_id ORDER BY v2.id DESC LIMIT 1 ) WHERE v1.indRef_USD IS NULL AND v1.fund_id>=1540;

///////§//////////////////////////////
Update max date vl dans fond_investissements

UPDATE fond_investissements f
SET datejour = (
    SELECT MAX(v.date)
    FROM valorisations v
    WHERE v.fund_id = f.id
);
////////////////////////////
Doublon 
select * FROM performences
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY date, fond_id ORDER BY (SELECT NULL)) AS row_num
        FROM 
            performences
    ) t
    WHERE t.row_num > 1
);

SELECT date, fond_id, COUNT(*)
FROM performences
GROUP BY date, fond_id
HAVING COUNT(*) > 1;

DELETE p1
FROM valorisations p1
JOIN valorisations p2
ON p1.date = p2.date
AND p1.fund_id = p2.fund_id
AND p1.id > p2.id;
///////////////////////////////
Modf fund_id par code_isin
UPDATE `valorisations` v
inner JOIN `fond_investissements` f ON v.code_ISIN = f.code_ISIN
SET v.fund_id = f.id;



//////////////////////////////
update`fond_investissements` set   categorie_regional=CONCAT(categorie_globale, ' ', "Afrique du Nord")  where pays="Tunisie";



UPDATE `fond_investissements` v
inner JOIN `indice_categorie` f ON v.categorie_national = f.categorie
SET v.indice = f.indice;

UPDATE valorisations v
inner join fond_investissements f on v.fund_id=f.id
inner JOIN `indice_categorie` i ON f.categorie_national = i.categorie
SET v.indice_name = i.indice;

UPDATE `valorisations` v
inner JOIN `fond_investissements` f ON v.fund_id = f.id
SET v.ID_indice = "S&P Tunisia Sovereign Bond Index" where f.categorie_national="Obligations Tunisie";