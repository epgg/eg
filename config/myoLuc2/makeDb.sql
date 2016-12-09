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
"/srv/epgg/data/data/subtleKnife/myoLuc2/",
"/srv/epgg/data/data/subtleKnife/seq/myoLuc2.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{}",
"GL429767,2636516,GL429767,2844833",
"ensGene,rmsk_all",
"GL429767,GL429768,GL429769,GL429770,GL429771,GL429772,GL429773,GL429774,GL429775,GL429776,GL429777,GL429778,GL429779,GL429780,GL429781,GL429782,GL429783,GL429784,GL429785,GL429786,GL429787,GL429788,GL429789,GL429790,GL429791,GL429792,GL429793,GL429794,GL429795",
true,
true,
null,
"Assembly version|myoLuc2|Sequence source|<a href=http://hgdownload.cse.ucsc.edu/goldenPath/myoLuc2/bigZips/ target=_blank>UCSC browser</a>|Date parsed|December 5, 2016|Chromosomes|0|Misc|11,654|Total bases|2,034,575,300|Logo art|<a href=https://www.broadinstitute.org/files/styles/landing_page/public/generic-pages/images/circle/bat.jpg target=_blank>link</a>",
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
