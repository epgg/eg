-- -------------------
--                  --
--  ce10
--                  --
-- -------------------
drop table if exists config;
create table config (
  bbiPath text not null,
  seqPath text null,
  defaultGenelist text not null,
  defaultCustomtracks text not null,
  defaultPosition varchar(255) not null,
  defaultDecor text null,
  defaultScaffold text not null,
  hasGene boolean not null,
  allowJuxtaposition boolean not null,
  keggSpeciesCode varchar(255) null,
  information text not null,
  runmode tinyint not null,
  initmatplot boolean not null
);
insert into config values(
"/srv/epgg/data/data/subtleKnife/ce10/",
"/srv/epgg/data/data/subtleKnife/seq/ce10.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"chrIII,7529565,chrIII,7529912",
"refGene,rmsk_all",
"chrI,chrII,chrIII,chrIV,chrV,chrX,chrM",
true,
true,
"cel",
"Assembly version|ce10|Sequence source|<a href=http://hgdownload.soe.ucsc.edu/goldenPath/ce10/bigZips/ target=_blank>UCSC Genome Browser</a>|Date parsed|October 2, 2015|Chromosomes|7|Contigs & misc|0|Total bases|100,286,070|Logo art|<a href=http://genome.ucsc.edu/images/Caenorhabditis_elegans.jpg target=_blank>link</a>",
0,
false
);

drop table if exists tempURL;
create table tempURL (
  session varchar(100) not null,
  offset INT unsigned not null,
  urlpiece text not null
);

drop table if exists scaffoldInfo;
create table scaffoldInfo (
  parent varchar(255) not null,
  child varchar(255) not null,
  childLength int unsigned not null
);
load data local infile "scaffoldInfo" into table scaffoldInfo;
