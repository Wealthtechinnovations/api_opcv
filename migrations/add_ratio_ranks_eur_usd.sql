-- Migration: Add ratio ranking columns to classementfonds_eurs and classementfonds_usds
-- Date: 2026-06-20
-- Purpose: Enable ratio bar charts on EUR/USD fund pages
-- Safe: All columns are nullable INT, no data loss, no existing column modification

-- EUR table
ALTER TABLE classementfonds_eurs
  ADD COLUMN IF NOT EXISTS rank3Moism INT NULL,
  ADD COLUMN IF NOT EXISTS rank3Moistotalm INT NULL,
  ADD COLUMN IF NOT EXISTS rank6Moism INT NULL,
  ADD COLUMN IF NOT EXISTS rank6Moistotalm INT NULL,
  ADD COLUMN IF NOT EXISTS rank1Anm INT NULL,
  ADD COLUMN IF NOT EXISTS rank1Antotalm INT NULL,
  ADD COLUMN IF NOT EXISTS rank3Ansm INT NULL,
  ADD COLUMN IF NOT EXISTS rank3Anstotalm INT NULL,
  ADD COLUMN IF NOT EXISTS rank5Ansm INT NULL,
  ADD COLUMN IF NOT EXISTS rank5Anstotalm INT NULL,
  ADD COLUMN IF NOT EXISTS rank1erJanvierm INT NULL,
  ADD COLUMN IF NOT EXISTS rank1erJanviertotalm INT NULL,
  ADD COLUMN IF NOT EXISTS ranksharpe INT NULL,
  ADD COLUMN IF NOT EXISTS ranksharpetotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankvolatilite INT NULL,
  ADD COLUMN IF NOT EXISTS rankvolatilitetotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankdsr INT NULL,
  ADD COLUMN IF NOT EXISTS rankdsrtotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankpertemax INT NULL,
  ADD COLUMN IF NOT EXISTS rankpertemaxtotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankinfo INT NULL,
  ADD COLUMN IF NOT EXISTS rankinfototal INT NULL,
  ADD COLUMN IF NOT EXISTS ranksortino INT NULL,
  ADD COLUMN IF NOT EXISTS ranksortinototal INT NULL,
  ADD COLUMN IF NOT EXISTS rankbetabaissier INT NULL,
  ADD COLUMN IF NOT EXISTS rankbetabaissiertotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankomega INT NULL,
  ADD COLUMN IF NOT EXISTS rankomegatotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankvar95 INT NULL,
  ADD COLUMN IF NOT EXISTS rankvar95total INT NULL,
  ADD COLUMN IF NOT EXISTS rankcalamar INT NULL,
  ADD COLUMN IF NOT EXISTS rankcalamartotal INT NULL;

-- USD table
ALTER TABLE classementfonds_usds
  ADD COLUMN IF NOT EXISTS rank3Moism INT NULL,
  ADD COLUMN IF NOT EXISTS rank3Moistotalm INT NULL,
  ADD COLUMN IF NOT EXISTS rank6Moism INT NULL,
  ADD COLUMN IF NOT EXISTS rank6Moistotalm INT NULL,
  ADD COLUMN IF NOT EXISTS rank1Anm INT NULL,
  ADD COLUMN IF NOT EXISTS rank1Antotalm INT NULL,
  ADD COLUMN IF NOT EXISTS rank3Ansm INT NULL,
  ADD COLUMN IF NOT EXISTS rank3Anstotalm INT NULL,
  ADD COLUMN IF NOT EXISTS rank5Ansm INT NULL,
  ADD COLUMN IF NOT EXISTS rank5Anstotalm INT NULL,
  ADD COLUMN IF NOT EXISTS rank1erJanvierm INT NULL,
  ADD COLUMN IF NOT EXISTS rank1erJanviertotalm INT NULL,
  ADD COLUMN IF NOT EXISTS ranksharpe INT NULL,
  ADD COLUMN IF NOT EXISTS ranksharpetotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankvolatilite INT NULL,
  ADD COLUMN IF NOT EXISTS rankvolatilitetotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankdsr INT NULL,
  ADD COLUMN IF NOT EXISTS rankdsrtotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankpertemax INT NULL,
  ADD COLUMN IF NOT EXISTS rankpertemaxtotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankinfo INT NULL,
  ADD COLUMN IF NOT EXISTS rankinfototal INT NULL,
  ADD COLUMN IF NOT EXISTS ranksortino INT NULL,
  ADD COLUMN IF NOT EXISTS ranksortinototal INT NULL,
  ADD COLUMN IF NOT EXISTS rankbetabaissier INT NULL,
  ADD COLUMN IF NOT EXISTS rankbetabaissiertotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankomega INT NULL,
  ADD COLUMN IF NOT EXISTS rankomegatotal INT NULL,
  ADD COLUMN IF NOT EXISTS rankvar95 INT NULL,
  ADD COLUMN IF NOT EXISTS rankvar95total INT NULL,
  ADD COLUMN IF NOT EXISTS rankcalamar INT NULL,
  ADD COLUMN IF NOT EXISTS rankcalamartotal INT NULL;

-- Convert crashed MyISAM tables to InnoDB (crash-safe)
ALTER TABLE classementfonds ENGINE=InnoDB;
ALTER TABLE classementfonds_eurs ENGINE=InnoDB;
ALTER TABLE classementfonds_usds ENGINE=InnoDB;

-- Repair any current corruption first
REPAIR TABLE classementfonds;
REPAIR TABLE classementfonds_eurs;
REPAIR TABLE classementfonds_usds;
