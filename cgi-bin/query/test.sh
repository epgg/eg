url=http://vizhub.wustl.edu/hubSample/hg19/sample.bigWig
xx="https://www.encodeproject.org/files/ENCFF188HKC/@@download/ENCFF188HKC.bigWig"
url2=http://ftp.ensembl.org/pub/data_files/homo_sapiens/GRCh38/rnaseq/GRCh38.illumina.sk_muscle.1.bam.bw
#echo ${xx}
#./querybw ${url} chr7 27053199 27373567 50 bwOutput.txt 1
#./querybw ${xx} chr1 10000000 10001000 50 bwOutput1.txt 1
#./querybw ${url} chr7 0 200 20 sbwOutput.txt 1
#./querybw ${xx} chr7 1000 10000 20 sbwOutput1.txt 1
#./querybw ${url2} 21 33031597 34041570 100 ebwOutput.txt 1
bb="https://www.encodeproject.org/files/ENCFF001JBR/@@download/ENCFF001JBR.bigBed"
./querybb ${bb} chr1 4450000 4500000 xx
