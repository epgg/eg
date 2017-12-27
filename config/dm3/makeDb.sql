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
"/srv/epgg/data/data/subtleKnife/dm3/",
"/srv/epgg/data/data/subtleKnife/seq/dm3.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{3:{url:'http://vizhub.wustl.edu/hubSample/dm3/1.gz',name:'test track'},1:{url:'http://vizhub.wustl.edu/hubSample/dm3/bed.gz',name:'test track'},5:{url:'http://vizhub.wustl.edu/hubSample/dm3/1_sorted.gz',name:'test track'},100:{url:'http://vizhub.wustl.edu/hubSample/dm3/hub'}}",
"chr3R,2636516,chr3R,2844833",
"longrange,modencode",
"refGene,rmsk_all",
"chr2L,chr2LHet,chr2R,chr2RHet,chr3L,chr3LHet,chr3R,chr3RHet,chr4,chrU,chrUextra,chrX,chrXHet,chrYHet,chrM",
true,
true,
"dme",
"Assembly version|dm3|Sequence source|<a href=http://hgdownload.cse.ucsc.edu/goldenPath/dm3/bigZips/ target=_blank>UCSC browser</a>|Date parsed|January 1, 2012|Chromosomes|8|Misc|7|Total bases|139,485,381|Logo art|<a href=http://imgs.sfgate.com/c/pictures/2006/06/30/mn_fruitflies30.jpg target=_blank>link</a>",
0,
false
);




drop table if exists tempURL;
create table tempURL (
  session varchar(100) not null,
  offset INT unsigned not null,
  urlpiece text not null
);

drop table if exists dataset;
drop table if exists mock;

drop table if exists modencode;

drop table if exists longrange;


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
load data local infile "cytoband" into table cytoband;
