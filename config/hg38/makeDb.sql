-- -------------------
--                  --
--    hg19heatmap   --
--                  --
-- -------------------
drop table if exists config;
create table config (
  bbiPath text not null,
  seqPath text null,
  defaultGenelist text not null,
  defaultCustomtracks text null,
  defaultPosition varchar(255) not null,
  defaultDecor text null,
  defaultScaffold text null,
  hasGene boolean not null,
  allowJuxtaposition boolean not null,
  keggSpeciesCode varchar(255) not null,
  information text not null,
  runmode tinyint not null,
  initmatplot boolean not null
);
insert into config values(
"/srv/epgg/data/data/subtleKnife/hg38/",
"/srv/epgg/data/data/subtleKnife/seq/hg38.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"chr7,27066840,chr7,27266928",
"refGene,rmsk_all",
"chr1,chr2,chr3,chr4,chr5,chr6,chr7,chr8,chr9,chr10,chr11,chr12,chr13,chr14,chr15,chr16,chr17,chr18,chr19,chr20,chr21,chr22,chrX,chrY,chrM",
true,
true,
"hsa",
"Assembly version|GRCh38/hg38|Sequence source|<a href=http://hgdownload.cse.ucsc.edu/goldenPath/hg38/bigZips/ target=_blank>UCSC browser</a>|Date parsed|March 7, 2014|Chromosomes|25|Scaffolds|68|Logo art|<a href=http://turing.iimas.unam.mx/~cgg/gallery/EverybodysHive.html target=_blank>link</a>",
0,
false
);


-- grouping types on genomic features
drop table if exists gfGrouping;
create table gfGrouping (
  id TINYINT not null primary key,
  name char(50) not null
);
insert into gfGrouping values (2, "Genes");
insert into gfGrouping values (4, "RepeatMasker");
insert into gfGrouping values (5, "G/C related");


-- for genomic features that can be used as horizontal axis
-- each type of gf (except genome) will have a corresponding covering table


/* for stuff that can be plotted as decorative tracks (no genome)
   the grp is also from gfGrouping table
   filetype: 0: server bigBed, 2: server bigWig
   name will be used to compose bbi file "name.bigBed"

   ambiguity with hasStruct field:
   if it is set to true, it indicates existance of both [x]symbol and [x]struct tables
   so currently it only works for gene model track (must belong to gene group)
   where generic genomic feature track wouldn't necessarily require [x]symbol table (might not be big trouble?)
*/
drop table if exists decorInfo;
create table decorInfo (
  name char(50) not null,
  printname char(100) not null,
  parent char(50) null,
  grp tinyint not null,
  fileType tinyint not null,
  hasStruct tinyint null, /* value must be 0/1, must not be boolean */
  queryUrl varchar(255) null
);
load data local infile 'decorInfo' into table decorInfo;
load data local infile 'decorInfo_rmsk' into table decorInfo;



drop table if exists track2Label;
drop table if exists track2ProcessInfo;
drop table if exists track2BamInfo;
drop table if exists track2Regions;
drop table if exists dataset;
drop table if exists roadmapepigenome;
drop table if exists longrange;
drop table if exists mock;
drop table if exists encode;

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
load data local infile 'track2Style' into table track2Style;
load data local infile 'track2Style_rmsk' into table track2Style;



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

drop table if exists cytoband;
create table cytoband (
  id int null auto_increment primary key,
  chrom char(20) not null,
  start int not null,
  stop int not null,
  name char(20) not null,
  colorIdx int not null
);
load data local infile "cytoband" into table cytoband;


