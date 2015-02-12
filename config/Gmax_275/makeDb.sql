drop table if exists config;
create table config (
  bbiPath text not null,
  seqPath text null,
  defaultGenelist text null,
  defaultCustomtracks text null,
  defaultPosition varchar(255) not null,
  defaultDataset varchar(255) not null,
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
"/srv/epgg/data/data/subtleKnife/Gmax_275/",
"/srv/epgg/data/data/subtleKnife/seq/Gmax_275.gz",
\N,
"{}",
"Chr01,14872,Chr01,374047",
"mock",
"gene",
"Chr01,Chr02,Chr03,Chr04,Chr05,Chr06,Chr07,Chr08,Chr09,Chr10,Chr11,Chr12,Chr13,Chr14,Chr15,Chr16,Chr17,Chr18,Chr19,Chr20",
true,
true,
"Gmax",
"Assembly version|Gmax_275|Sequence source|<a href=ftp://ftp.jgi-psf.org/pub/compgen/phytozome/v9.0/early_release/Gmax_275_Wm82.a2.v1/assembly/ target=_blank>phytozome</a>|Date parsed|June 7, 2014|Chromosomes|20|Misc|1148|Total bases|973,344,380|Logo art|<a href=http://www.gov.pe.ca/af/agweb/index.php3?number=79367&lang=E target=_blank>link</a>",
0,
false
);


drop table if exists gfGrouping;
create table gfGrouping (
  id TINYINT not null primary key,
  name char(50) not null
);
insert into gfGrouping values (2, "Genes");
-- insert into gfGrouping values (5, "Others");



drop table if exists decorInfo;
create table decorInfo (
  name char(50) not null primary key,
  printname char(100) not null,
  parent char(50) null,
  grp tinyint not null,
  fileType tinyint not null,
  hasStruct tinyint null,
  queryUrl varchar(255) null
);
load data local infile 'decorInfo' into table decorInfo;

drop table if exists track2Label;
drop table if exists track2ProcessInfo;

drop table if exists track2BamInfo;

drop table if exists track2Detail;
create table track2Detail (
  name varchar(255) not null primary key,
  detail text null
);
load data local infile 'track2Detail_decor' into table track2Detail;

drop table if exists track2GEO;

drop table if exists track2Categorical;

drop table if exists track2VersionInfo;


drop table if exists track2Annotation;

drop table if exists track2Ft;

drop table if exists track2Style;
create table track2Style (
  name varchar(255) not null primary key,
  style text not null
);
load data local infile "track2Style" into table track2Style;

drop table if exists track2Regions;


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


drop table if exists dataset;

drop table if exists mock;


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
