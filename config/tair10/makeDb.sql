drop table if exists config;
create table config (
  bbiPath text not null,
  seqPath text null,
  defaultGenelist text not null,
  defaultCustomtracks text not null,
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
"/srv/epgg/data/data/subtleKnife/tair10/",
"/srv/epgg/data/data/subtleKnife/seq/tair10.gz",
"CYP71B7\\nCYP86C3\\nCYP86C4\\nCYP79F2\\nCYP722A1\\nCYP86C1\\nCYP705A24\\nCYP76C6\\nCYP76C5\\nCYP94D1\\nCYP96A8\\nCYP705A27\\nCYP705A25\\nCYP59\\nCYP708A1\\nCYP79C3P\\nCYP86A7\\nCYP89A2\\nCYP89A7",
"{3:{url:'http://vizhub.wustl.edu/hubSample/tair10/1.gz',name:'test track'},5:{url:'http://vizhub.wustl.edu/hubSample/tair10/bed.gz',name:'test track'},100:{url:'http://vizhub.wustl.edu/hubSample/tair10/hub'}}",
"Chr1,11310415,Chr1,11320096",
"mock",
"tair10Gene,repeat",
"Chr1,Chr2,Chr3,Chr4,Chr5,ChrC,ChrM",
true,
true,
"ath",
"Assembly version|tair10|Sequence source|<a href=ftp://ftp.arabidopsis.org/home/tair/Sequences/whole_chromosomes/ target=_blank>TAIR</a>|Date parsed|December 1, 2011|Chromosomes|7|Total bases|119,667,750|Logo art|<a href=http://www.prl.msu.edu/Facultypages/NSF_MFT_Site/images/arabidopsis.jpg target=_blank>link</a>",
0,
false
);


drop table if exists gfGrouping;
create table gfGrouping (
  id TINYINT not null primary key,
  name char(50) not null
);
insert into gfGrouping values (2, "Genes");
insert into gfGrouping values (5, "Others");



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

drop table if exists track2GEO;
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
