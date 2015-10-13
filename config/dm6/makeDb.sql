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
"/srv/epgg/data/data/subtleKnife/dm6/",
"/srv/epgg/data/data/subtleKnife/seq/dm6.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"chr3R,2636516,chr3R,2844833",
"refGene,rmsk_all",
"chr2L,chr2R,chr3L,chr3R,chr4,chrX,chrY,chrM",
true,
true,
"dme",
"Assembly version|dm6|Sequence source|<a href=http://hgdownload.cse.ucsc.edu/goldenPath/dm6/bigZips/ target=_blank>UCSC browser</a>|Date parsed|October 13, 2015|Chromosomes|8|Misc|1,862|Total bases|143,726,002|Logo art|<a href=http://imgs.sfgate.com/c/pictures/2006/06/30/mn_fruitflies30.jpg target=_blank>link</a>",
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
