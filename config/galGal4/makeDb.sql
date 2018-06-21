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
"/srv/epgg/data/data/subtleKnife/galGal4/",
"/srv/epgg/data/data/subtleKnife/seq/galGal4.gz",
"cyp2v1\\ncyp2aa4\\ncyp2x8\\ncyp2p9\\ncyp3c4\\ncyp24a1\\ncyp2p6\\ncyp2x12\\ncyp19a1a\\ncyp20a1\\ncyp2aa2\\ncyp11a1\\ncyp2ad2",
"{3:{url:'https://vizhub.wustl.edu/hubSample/galGal4/num1.gz',name:'test track'},1:{url:'https://vizhub.wustl.edu/hubSample/galGal4/bed.gz',name:'test track'},100:{url:'https://vizhub.wustl.edu/hubSample/galGal4/hub'}}",
"chr2,32817948,chr2,32831737",
"published",
"refGene,rmsk_all",
"chr1,chr2,chr3,chr4,chr5,chr6,chr7,chr8,chr9,chr10,chr11,chr12,chr13,chr14,chr15,chr16,chr17,chr18,chr19,chr20,chr21,chr22,chr23,chr24,chr25,chr26,chr27,chr28,chr32,chrLGE64,chrW,chrZ,chrM",
true,
true,
"gga",
"Assembly version|galGal4|Sequence source|<a href=https://hgdownload.cse.ucsc.edu/goldenPath/galGal4/bigZips/ target=_blank>UCSC browser</a>|Date parsed|May 6, 2015|Chromosomes|33|Contigs|15899|Total bases|1,046,932,099|Logo art|<a href=https://orientalbirdimages.org/images/data/redjunglefowl_copy2.jpg target=_blank>link</a>",
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
drop table if exists published;

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
