from os import listdir

def makeList(filePath, datatype, ext):
    filePath = './' + filePath
    f = open("./ImageSet/Main/test" + datatype + ".txt", "w+")
    count = 0
    allfiles = sorted(listdir(filePath))
    for file in allfiles:
        if file.endswith(ext):
            count += 1
            file = file.split(ext)
            f.write(file[0])
            f.write('\n')
    print(str(count) + " filenames written to test" + datatype + ".txt!")
    f.close()

if __name__ == "__main__":
    makeList("PCDPoints", "PCD", ".pcd")
    makeList("JPEGImages", "JPEG", ".jpg")
