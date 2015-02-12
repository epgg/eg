-- -------------------
--                  --
--  rheMac3
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
"/srv/epgg/data/data/subtleKnife/rheMac3/",
"/srv/epgg/data/data/subtleKnife/seq/rheMac3.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"chr11,51305170,chr11,51361224",
"refGene,xenoRefGene,rmsk_all",
"chr1,chr2,chr3,chr4,chr5,chr6,chr7,chr8,chr9,chr10,chr11,chr12,chr13,chr14,chr15,chr16,chr17,chr18,chr19,chr20,chrX,chrM",
true,
true,
"mcc",
"Assembly version|rheMac3|Sequence source|<a href=http://hgdownload.soe.ucsc.edu/goldenPath/rheMac3/bigZips/ target=_blank>UCSC Genome Browser</a>|Date parsed|Dec 7, 2013|Chromosomes|22|Contigs & misc|34081|Logo art|<a href=http://en.wikipedia.org/wiki/File:Macaca_mulatta_in_Guiyang.jpg target=_blank>link</a>",
0,
false
);


drop table if exists gfGrouping;
create table gfGrouping (
  id TINYINT not null primary key,
  name char(50) not null
);
insert into gfGrouping values (2, "Genes");
insert into gfGrouping values (4, "RepeatMasker");
insert into gfGrouping values (5, "Others");



drop table if exists decorInfo;
create table decorInfo (
  name char(50) not null,
  printname char(100) not null,
  parent char(50) null,
  grp tinyint not null,
  fileType tinyint not null,
  hasStruct tinyint null,
  queryUrl varchar(255) null
);
load data local infile 'decorInfo' into table decorInfo;
load data local infile 'decorInfo_rmsk' into table decorInfo;

drop table if exists track2Detail;
create table track2Detail (
  name varchar(255) not null primary key,
  detail text null
);
load data local infile 'track2Detail' into table track2Detail;
load data local infile 'track2Detail_rmsk' into table track2Detail;

drop table if exists track2Categorical;
create table track2Categorical (
  name varchar(255) not null primary key,
  info text not null
);
load data local infile 'track2Categorical' into table track2Categorical;


drop table if exists track2Style;
create table track2Style (
  name varchar(255) not null primary key,
  style text not null
);
load data local infile "track2Style" into table track2Style;
load data local infile "track2Style_rmsk" into table track2Style;

drop table if exists metadataVocabulary;
create table metadataVocabulary (
  child varchar(255) not null,
  parent varchar(255) not null
);
load data local infile "metadataVocabulary" into table metadataVocabulary;

drop table if exists trackAttr2idx;
create table trackAttr2idx (
  idx varchar(255) not null primary key,
  attr varchar(255) not null,
  note varchar(255) null,
  description text null
);
load data local infile "trackAttr2idx" into table trackAttr2idx;


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
