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
INSERT INTO `config` VALUES (
'/srv/epgg/data/data/subtleKnife/AcNPV/',
'/srv/epgg/data/data/subtleKnife/seq/AcNPV.gz',
NULL,
'{}',
'NC_001623.1,0,NC_001623.1,10000',
'mock',
'gene,gc5Base',
'NC_001623.1',
1,
1,
'AcNPV',
'Assembly version|08-MAR-1999|Sequence source|<a href=http://www.ncbi.nlm.nih.gov/nuccore/NC_001623 target=_blank>NCBI</a>|Reference|<a href=http://www.ncbi.nlm.nih.gov/pubmed/8030224 target=_blank>Virology. 1994 Aug 1;202(2):586-605.</a>|Date parsed|September 16, 2013|Chromosomes|1|Misc|0|Total bases|133,894|Logo art|<a href=http://viralzone.expasy.org/all_by_protein/537.html target=_blank>link</a>',
0,
0);


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
  id int unique auto_increment primary key,
  chrom char(20) not null,
  start int not null,
  stop int not null,
  name char(20) not null,
  colorIdx int not null
);
