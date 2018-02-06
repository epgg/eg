drop table if exists config;
create table config (
  bbiPath text not null,
  seqPath text null,
  defaultGenelist text not null,
  defaultCustomtracks text not null,
  defaultPosition varchar(255) not null,
  defaultDataset varchar(255) not null,
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
"/srv/epgg/data/data/subtleKnife/mm9/",
"/srv/epgg/data/data/subtleKnife/seq/mm9.gz",
"CYP4Z1\\nCYP2A7\\nCYP2A6\\nCYP3A4\\nCYP1A1\\nCYP4V2\\nCYP51A1\\nCYP2C19\\nCYP26B1\\nCYP11B2\\nCYP24A1\\nCYP4B1\\nCYP2C8",
"{3:{url:'http://vizhub.wustl.edu/hubSample/mm9/wgEncodeLicrHistoneBatInputMAdult24wksC57bl6StdSig.gz',name:'test track'},1:{url:'http://vizhub.wustl.edu/hubSample/mm9/bed.gz',name:'test track'},5:{url:'http://vizhub.wustl.edu/hubSample/mm9/wgEncodeLicrHistoneBatInputMAdult24wksC57bl6StdAlnRep2.gz',name:'test track'},100:{url:'http://vizhub.wustl.edu/hubSample/mm9/hub'},21:{hg19:'http://vizhub.wustl.edu/public/mm9/weaver/mm9_hg19_axt.gz',rn4:'http://vizhub.wustl.edu/public/mm9/weaver/mm9_rn4_axt.gz'}}",
"chr6,51999773,chr6,52368420",
"longrange,encode",
"refGene,rmsk_all",
"chr1,chr2,chr3,chr4,chr5,chr6,chr7,chr8,chr9,chr10,chr11,chr12,chr13,chr14,chr15,chr16,chr17,chr18,chr19,chrX,chrY,chrM",
true,
true,
"mmu",
"Assembly version|mm9|Sequence source|<a href=http://hgdownload.cse.ucsc.edu/goldenPath/mm9/bigZips/ target=_blank>UCSC browser</a>|Date parsed|August 1, 2011|Chromosomes|22|Misc|13|Total bases|3,137,144,693|Logo art|<a href=http://free-extras.com/images/mouse-8552.htm target=_blank>link</a>",
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
  id int unique auto_increment primary key,
  chrom char(20) not null,
  start int not null,
  stop int not null,
  name char(20) not null,
  colorIdx int not null
);
load data local infile "cytoband" into table cytoband;
