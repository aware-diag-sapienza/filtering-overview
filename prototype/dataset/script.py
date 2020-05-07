with open("air.csv", "r") as file:
    with open("air2.csv", "w") as fileOut:
        for line in file.readlines():
            line = line.replace(";", ",")
            fileOut.write(line)