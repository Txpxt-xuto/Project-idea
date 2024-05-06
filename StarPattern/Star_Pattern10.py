# Spiral alphabets #
import numpy as np
matrix = np.zeros((8,8),dtype=str)
row = 0
limcol = 7
asci = 65
for j in range(4):
    for i in range(4):
        for col in range(row, limcol):
            matrix[row][col] = chr(asci)
            asci +=1
            if asci == 91:
                asci = 65
        matrix = np.rot90(matrix, k=1)
    row += 1
    limcol -= 1
for r in range(8):
    for c in range(8):
        print(matrix[r][c], end=' ')
    print()