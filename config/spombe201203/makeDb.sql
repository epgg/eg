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
"/srv/epgg/data/data/subtleKnife/spombe201203/",
"/srv/epgg/data/data/subtleKnife/seq/spombe201203.gz",
"no gene",
"{3:{url:'https://vizhub.wustl.edu/hubSample/spombe201203/rand.gz',name:'test track'},15:{url:'https://vizhub.wustl.edu/hubSample/spombe201203/rand1.bigWig',name:'test track'},1:{url:'https://vizhub.wustl.edu/hubSample/spombe201203/bed.gz',name:'test track'},100:{url:'https://vizhub.wustl.edu/hubSample/spombe201203/hub'}}",
"chromosome3,322500,chromosome3,353700",
"mock",
"pombase_gene,repeat",
"chromosome1,chromosome2,chromosome3,mating_type_region,Spmit,telomeric_contig",
true,
true,
"spo",
"Assembly release|March 2012|Sequence source|<a href=https://www.pombase.org target=_blank>PomBase</a>|Date parsed|November 6, 2012|Chromosomes|3|Total bases|12,631,379|Logo art|<a href=https://cwp.embo.org/pc09-17/ target=_blank>link</a>",
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
  id int unique auto_increment primary key,
  chrom char(20) not null,
  start int not null,
  stop int not null,
  name char(20) not null,
  colorIdx int not null
);
